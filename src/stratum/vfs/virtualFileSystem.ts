import { loadAsync } from "jszip";
import { FileSystem, ProjectOpenOptions, OpenZipOptions } from "stratum/api";
import { ClassProto } from "stratum/common/classProto";
import { ProjectInfo } from "stratum/fileFormats/prj";
import { VariableSet } from "stratum/fileFormats/stt";
import { extractPrefixAndDirParts, getPathParts, SLASHES } from "stratum/helpers/pathOperations";
import { Player } from "stratum/player";
import { parseBytecode } from "stratum/vm/parseBytecode";
import { ParsedCode } from "stratum/vm/types";
import { VirtualDir, VirtualFile } from ".";
import { VirtualFileContent } from "./virtualFileContent";

export class VirtualFileSystem implements FileSystem {
    static async fromZip(source: File | Blob | ArrayBuffer, options: OpenZipOptions = {}): Promise<VirtualFileSystem> {
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

        const [diskPrefixUC, p1] = extractPrefixAndDirParts(options.directory || "", "Z");

        let root = new VirtualDir(diskPrefixUC + ":");
        const fs = new VirtualFileSystem();
        fs.diskNew(diskPrefixUC, root);

        for (const p of p1) root = root.folderNew(p);

        zip.forEach((path, zipObj) => {
            const p2 = path.split(SLASHES);
            let fd = root;
            for (let i = 0; i < p2.length - 1; i++) fd = fd.folder(p2[i]);
            // Лучше это
            if (!zipObj.dir) fd.fileNew(p2[p2.length - 1], new VirtualFileContent(zipObj));
            // А такой вариант создал бы пустую директорию.
            // {
            //     const last = p2[p2.length - 1];
            //     if (zipObj.dir) fd.folderNew(last);
            //     else fd.fileNew(last, new VirtualFileContent(zipObj));
            // }
        });
        return fs;
    }

    private readonly disks = new Map<string, VirtualDir>();

    private diskNew(prefixUC: string, dir: VirtualDir) {
        const { disks } = this;

        const prv = disks.size;
        this.disks.set(prefixUC, dir);
        if (disks.size === prv) throw Error(`Конфликт имен дисков: ${prefixUC}`);
    }

    merge(fs: FileSystem): this {
        if (!(fs instanceof VirtualFileSystem)) throw Error("fs is not instanceof VirtualFileSystem");
        const { disks: otherDisks } = fs;
        const { disks: myDisks } = this;
        for (const [prefixUC, otherRoot] of otherDisks) {
            const myRoot = myDisks.get(prefixUC);
            if (myRoot) myRoot.merge(otherRoot);
            else myDisks.set(prefixUC, otherRoot);
        }
        return this;
    }

    *search(regexp: RegExp): IterableIterator<VirtualFile> {
        for (const disk of this.disks.values()) for (const f of disk.search(regexp)) yield f;
    }

    resolveFile(path: string, currentDir?: VirtualDir) {
        const pp = getPathParts(path);
        const isAbsolute = pp[0].length === 2 && pp[0][1] === ":";

        let target = isAbsolute ? this.disks.get(pp[0][0].toUpperCase()) : currentDir;
        if (!target) return undefined;

        for (let i = isAbsolute ? 1 : 0; i < pp.length - 1; i++) {
            if (pp[i] === "..") {
                target = target.parent;
            } else {
                const next = target.folderGet(pp[i]);
                if (!next) return undefined;
                target = next;
            }
        }

        const last = pp[pp.length - 1];
        return last === ".." ? target.parent : target.get(last);
    }

    async project(openOptions: ProjectOpenOptions = {}) {
        // 1) Находим директорию проекта, считываем .prj файл,
        let workDir: VirtualDir, prjInfo: ProjectInfo;
        {
            let prjFile: VirtualFile | undefined;
            const matches = new Array<string>();

            const regexp = openOptions.tailPath
                ? new RegExp(getPathParts(openOptions.tailPath).join("\\\\") + "$", "i")
                : /.+\.(prj)|(spj)$/i;
            for (const v of this.search(regexp)) {
                prjFile = v;
                matches.push(v.pathDos);
                if (openOptions.firstMatch) break;
            }
            if (!prjFile) throw Error("Не найдено файлов проектов");
            if (matches.length > 1) throw Error(`Найдено несколько подходящих файлов:\n${matches.join("\n")}`);

            workDir = prjFile.parent;
            prjInfo = await prjFile.readAs("prj");
        }

        // 2) Определяем пути поиска файлов имиджей.
        const classDirs = new Set([workDir]);
        {
            // 2.1) Разбираем пути поиска имиджей, которые через запятую прописаны в настройках проекта.
            const addPaths = prjInfo.settings && prjInfo.settings.classSearchPaths;
            if (addPaths) {
                addPaths
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s)
                    .forEach((path) => {
                        const resolved = this.resolveFile(path, workDir);
                        if (resolved && resolved.dir) classDirs.add(resolved);
                    });
            }

            // 2.2) Которые ищутся дополнительно (например, если у нас стандартная библиотека отдельным архивом)
            if (openOptions.additionalClassPaths) {
                for (const p of openOptions.additionalClassPaths) {
                    const [prefixUC, parts] = extractPrefixAndDirParts(p, "Z");
                    let target = this.disks.get(prefixUC);
                    for (let i = 0; i < parts.length && target; i++) target = target.folderGet(parts[i]);
                    if (target) classDirs.add(target);
                }
            }
        }

        classDirs.forEach((c) => {
            for (; c !== c.parent; c = c.parent) if (classDirs.has(c.parent)) classDirs.delete(c);
        });

        // 3) Загружаем имиджи из выбранных директорий.
        const classes = new Map<string, ClassProto<ParsedCode>>();
        {
            const searchRes = [...classDirs.values()].map((c) => [...c.search(/.+\.cls$/i)]);
            const classFiles = new Array<VirtualFile>().concat(...searchRes);
            const protos = await Promise.all(classFiles.map((f) => f.readAs("cls", parseBytecode)));
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
            const sttFile = workDir.fileGet("_preload.stt");
            if (sttFile) {
                try {
                    stt = await sttFile.readAs("stt");
                } catch (e) {
                    console.warn(e.message);
                }
            }
        }

        // 5) Из всего этого создаем новый проигрыватель проекта.
        return new Player({
            fs: this,
            workDir,
            prjInfo,
            classes,
            stt,
        });
    }
}
