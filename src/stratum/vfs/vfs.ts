import { loadAsync } from "jszip";
import { FileSystem, OpenProjectOptions, OpenZipOptions } from "stratum/api";
import { ProjectInfo } from "stratum/fileFormats/prj";
import { VariableSet } from "stratum/fileFormats/stt";
import { getPathParts, getPrefixAndPathParts, SLASHES } from "stratum/helpers/pathOperations";
import { Player } from "stratum/player";
import { parseBytecode } from "stratum/vm/parseBytecode";
import { VFSDir, VFSFile } from ".";

export class VFS implements FileSystem {
    static async fromZip(source: File | Blob | ArrayBuffer | Uint8Array, options: OpenZipOptions = {}): Promise<VFS> {
        const decoder = new TextDecoder(options.encoding || "cp866");

        let zip: ReturnType<typeof loadAsync> extends Promise<infer U> ? U : never;
        try {
            zip = await loadAsync(source, { decodeFileName: (b) => decoder.decode(b), createFolders: false });
        } catch (e) {
            const str =
                source instanceof File
                    ? `Файл ${source.name}`
                    : source instanceof Blob
                    ? `Blob { size: ${source.size}, type: ${source.type} }`
                    : `${source.toString()}(${source.byteLength})`;
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
        if (!(fs instanceof VFS)) throw Error("fs is not instanceof VFS");
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

    async project(options: OpenProjectOptions = {}) {
        // 1) Находим директорию проекта, считываем .prj/.spj файл,
        let workDir: VFSDir, prjInfo: ProjectInfo;
        {
            let prjFile: VFSFile | undefined;
            const matches = new Array<string>();

            const tailPathDosUC = options.tailPath && getPathParts(options.tailPath).join("\\").toUpperCase();
            for (const v of this.search(/.+\.(prj|spj)$/i)) {
                if (tailPathDosUC && !v.pathDos.toUpperCase().includes(tailPathDosUC)) continue;
                prjFile = v;
                matches.push(v.pathDos);
            }
            if (matches.length > 1) throw Error(`Найдено несколько файлов проектов:\n${matches.join("\n")}`);

            if (!prjFile) throw Error("Не найдено файлов проектов");
            workDir = prjFile.parent;
            prjInfo = await prjFile.readAs("prj");
        }

        // 2) Определяем пути поиска файлов имиджей.
        const classDirs = new Set([workDir]);
        {
            // 2.1) Разбираем пути поиска имиджей, которые через запятую прописаны в настройках проекта.
            const settingsPaths = prjInfo.settings?.classSearchPaths;
            if (settingsPaths) {
                //prettier-ignore
                const pathsSeparated = settingsPaths.split(",").map((s) => s.trim()).filter((s) => s);
                for (const path of pathsSeparated) {
                    const resolved = workDir.get(path);
                    if (resolved?.dir) classDirs.add(resolved);
                }
            }

            // 2.2) Которые мы еще сами хотим добавить (например, если у нас стандартная библиотека отдельным архивом)
            const addPaths = options.additionalClassPaths;
            if (addPaths) {
                for (const p of addPaths) {
                    const resolved = (this.disks.get("Z") || workDir).get(p);
                    if (resolved?.dir) classDirs.add(resolved);
                }
            }
            // Исключаем ошибки рекурсивного сканирования имиджей
            // (оригинальный Stratum так, кстати, не умеет)
            for (let c of classDirs) for (; c !== c.parent; c = c.parent) if (classDirs.has(c.parent)) classDirs.delete(c);
        }

        // 3) Загружаем имиджи из выбранных директорий.
        const searchRes = [...classDirs].map((c) => [...c.files(/.+\.cls$/i)]);
        const classFiles = new Array<VFSFile>().concat(...searchRes);
        const classes = await Promise.all(classFiles.map((f) => f.readAs("cls", parseBytecode)));

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
        return new Player({ dir: workDir, prjInfo, classes, stt, options });
    }
}
