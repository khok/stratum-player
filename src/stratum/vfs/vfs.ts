import { loadAsync } from "jszip";
import { FileSystem, OpenProjectOptions, OpenZipOptions } from "stratum/api";
import { ClassProto } from "stratum/common/classProto";
import { ProjectInfo } from "stratum/fileFormats/prj";
import { VariableSet } from "stratum/fileFormats/stt";
import { getPrefixAndPathParts, getPathParts, SLASHES } from "stratum/helpers/pathOperations";
import { Player } from "stratum/player";
import { parseBytecode } from "stratum/vm/parseBytecode";
import { ParsedCode } from "stratum/vm/types";
import { VFSDir, VFSFile } from ".";

export class VFS implements FileSystem {
    static async fromZip(source: File | Blob | ArrayBuffer, options: OpenZipOptions = {}): Promise<VFS> {
        const decoder = new TextDecoder(options.encoding || "cp866");

        let zip: ReturnType<typeof loadAsync> extends Promise<infer U> ? U : never;
        try {
            zip = await loadAsync(source, {
                decodeFileName: (b) => decoder.decode(b),
                createFolders: false,
            });
        } catch (e) {
            const str =
                source instanceof File
                    ? `Файл ${source.name}`
                    : source instanceof Blob
                    ? `Blob { size: ${source.size}, type: ${source.type} }`
                    : `ArrayBuffer(${source.byteLength})`;
            throw Error(`${str} не является ZIP-архивом`);
        }

        const [diskPrefixUC, p1] = getPrefixAndPathParts(options.directory || "", "Z");
        const fs = new VFS();
        let root = new VFSDir(diskPrefixUC + ":", fs);

        fs.diskNew(diskPrefixUC, root);
        for (const p of p1) root = root.folderLocal(p);

        zip.forEach((path, zipObj) => {
            const p2 = path.split(SLASHES);
            let fd = root;
            for (let i = 0; i < p2.length - 1; i++) fd = fd.folderLocal(p2[i]);
            // Лучше это
            if (!zipObj.dir) fd.fileNewLocal(p2[p2.length - 1], zipObj);
            // А такой вариант создал бы пустую директорию.
            // {
            //     const last = p2[p2.length - 1];
            //     if (zipObj.dir) fd.folderNew(last);
            //     else fd.fileNew(last, new VirtualFileContent(zipObj));
            // }
        });
        return fs;
    }

    private readonly disks = new Map<string, VFSDir>();

    disk(name: string) {
        return this.disks.get(name.toUpperCase());
    }

    private diskNew(prefixUC: string, dir: VFSDir) {
        const { disks } = this;

        const prv = disks.size;
        this.disks.set(prefixUC, dir);
        if (disks.size === prv) throw Error(`Конфликт имен дисков: ${prefixUC}`);
    }

    merge(fs: FileSystem): this {
        if (!(fs instanceof VFS)) throw Error("fs is not instanceof VirtualFileSystem");
        const { disks: otherDisks } = fs;
        const { disks: myDisks } = this;
        for (const [prefixUC, otherRoot] of otherDisks) {
            const myRoot = myDisks.get(prefixUC);
            if (myRoot) myRoot.merge(otherRoot);
            else myDisks.set(prefixUC, otherRoot);
        }
        return this;
    }

    *search(regexp: RegExp): IterableIterator<VFSFile> {
        for (const disk of this.disks.values()) for (const f of disk.files(regexp)) yield f;
    }

    async project(opts: OpenProjectOptions = {}) {
        // 1) Находим директорию проекта, считываем .prj/.spj файл,
        let workDir: VFSDir, prjInfo: ProjectInfo;
        {
            let prjFile: VFSFile | undefined;
            const matches = new Array<string>();

            const normPathDosUC = opts.tailPath && getPathParts(opts.tailPath).join("\\").toUpperCase();
            for (const v of this.search(/.+\.(prj)|(spj)$/i)) {
                if (normPathDosUC && !v.pathDos.toUpperCase().includes(normPathDosUC)) continue;
                prjFile = v;
                matches.push(v.pathDos);
                if (opts.firstMatch) break;
            }
            if (!prjFile) throw Error("Не найдено файлов проектов");
            if (matches.length > 1) throw Error(`Найдено несколько файлов проектов:\n${matches.join("\n")}`);

            workDir = prjFile.parent;
            prjInfo = await prjFile.readAs("prj");
        }

        // 2) Определяем пути поиска файлов имиджей.
        const classDirs = new Set([workDir]);
        {
            // 2.1) Разбираем пути поиска имиджей, которые через запятую прописаны в настройках проекта.
            const settingsPaths = prjInfo.settings && prjInfo.settings.classSearchPaths;
            if (settingsPaths) {
                //prettier-ignore
                const pathsSeparated = settingsPaths.split(",").map((s) => s.trim()).filter((s) => s);
                for (const path of pathsSeparated) {
                    const resolved = workDir.get(path);
                    if (resolved && resolved.dir) classDirs.add(resolved);
                }
            }

            // 2.2) Которые мы еще сами хотим добавить (например, если у нас стандартная библиотека отдельным архивом)
            if (opts.additionalClassPaths) {
                for (const p of opts.additionalClassPaths) {
                    const resolved = (this.disks.get("Z") || workDir).get(p);
                    if (resolved && resolved.dir) classDirs.add(resolved);
                }
            }
        }

        // Исключаем ошибки рекурсивного сканирования имиджей
        // (оригинальный Stratum так, кстати, не умеет)
        for (let c of classDirs) for (; c !== c.parent; c = c.parent) if (classDirs.has(c.parent)) classDirs.delete(c);

        // 3) Загружаем имиджи из выбранных директорий.
        const classes = new Map<string, ClassProto<ParsedCode>>();
        {
            const searchRes = [...classDirs].map((c) => [...c.files(/.+\.cls$/i)]);
            const classFiles = new Array<VFSFile>().concat(...searchRes);
            const protos = await Promise.all(classFiles.map((f) => f.readAs("cls", parseBytecode)));

            // Превращаем Array в Map
            for (const p of protos) {
                const keyUC = p.name.toUpperCase();
                const prev = classes.size;
                classes.set(keyUC, p);
                if (classes.size === prev) {
                    const files = protos.filter((c) => c.name.toUpperCase() === keyUC).map((c) => c.filepathDos);
                    throw Error(`Конфликт имен имиджей: "${p.name}" обнаружен в файлах:\n${files.join(";\n")}.`);
                }
            }
        }

        // 4) Загружаем STT файл.
        let stt: VariableSet | undefined;
        {
            const sttFile = workDir.get("_preload.stt");
            if (sttFile && !sttFile.dir) {
                try {
                    stt = await sttFile.readAs("stt");
                } catch (e) {
                    console.warn(e.message);
                }
            }
        }

        // 5) Из всего этого создаем новый проигрыватель проекта.
        return new Player({ dir: workDir, prjInfo, classes, stt });
    }
}
