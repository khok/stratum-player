import { loadAsync } from "jszip";
import { FileSystem, OpenProjectOptions, OpenZipOptions, ZipSource } from "stratum/api";
import { ClassLibrary } from "stratum/common/classLibrary";
import { ClassProto } from "stratum/common/classProto";
import { VariableSet } from "stratum/fileFormats/stt";
import { getPrefixAndPathParts, SLASHES, splitPath } from "stratum/helpers/pathOperations";
import { RealPlayer } from "stratum/player";
import { ProjectResources } from "stratum/project";
import { VFSDir, VFSFile } from ".";

export class VFS implements FileSystem {
    private static defaultPrefix = "C";
    static async fromZip(source: ZipSource, options: OpenZipOptions = {}): Promise<VFS> {
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

        const fs = new VFS();

        const [diskPrefixUC, p1] = getPrefixAndPathParts(options.directory || "", VFS.defaultPrefix);
        let root = new VFSDir(diskPrefixUC, fs);
        fs.disks.set(diskPrefixUC, root);
        for (const p of p1) root = root.createLocalDir(p);

        zip.forEach((path, zipObj) => {
            const p2 = path.split(SLASHES);
            let fd = root;
            for (let i = 0; i < p2.length - 1; i++) fd = fd.createLocalDir(p2[i]);
            // Лучше это
            if (!zipObj.dir) fd.createLocalFile(p2[p2.length - 1], zipObj);
            // А такой вариант создал бы пустую директорию.
            // {
            //     const last = p2[p2.length - 1];
            //     if (zipObj.dir) fd.folderNew(last);
            //     else fd.fileNew(last, new VirtualFileContent(zipObj));
            // }
        });
        return fs;
    }

    private static async loadClasses(classDirs: Set<VFSDir>): Promise<ClassProto[]> {
        // 2.3) Исключаем ошибки рекурсивного сканирования имиджей (оригинальный Stratum так, кстати, не умеет)
        for (let c of classDirs) for (; c !== c.parent; c = c.parent) if (classDirs.has(c.parent)) classDirs.delete(c);

        const dirs = [...classDirs];
        console.log(`Пути поиска имиджей:\n${dirs.map((d) => d.pathDos).join(";\n")}`);

        // 2.4) Загружаем имиджи из выбранных директорий.
        const searchRes = dirs.map((c) => [...c.files(/.+\.cls$/i)]);
        const clsFiles = new Array<VFSFile>().concat(...searchRes);
        const clsProtos = await Promise.all(clsFiles.map((f) => f.readAs("cls")));
        console.log(`Загружено ${clsFiles.length} имиджей объемом ${(clsProtos.reduce((a, b) => a + b.byteSize, 0) / 1024).toFixed()} КБ`);
        return clsProtos;
    }

    static async project(prjFile: VFSFile, classes: ClassLibrary, id?: number): Promise<ProjectResources> {
        const workDir = prjFile.parent;
        console.log(`Открываем проект ${prjFile.pathDos}`);
        const prjInfo = await prjFile.readAs("prj");

        // 2) Загружаем имиджи
        {
            const classDirs = new Set([workDir]);
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

            const clsProtos = await VFS.loadClasses(classDirs);
            classes.add(clsProtos, id);
        }

        // 3) Загружаем STT файл.
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

        // 4) Из всего этого создаем новый проигрыватель проекта.
        return { dir: workDir, prjInfo, classes, stt };
    }

    private readonly disks = new Map<string, VFSDir>();
    disk(name: string) {
        return this.disks.get(name.toUpperCase());
    }

    merge(fs: FileSystem): this {
        if (!(fs instanceof VFS)) throw Error("fs is not instanceof VFS");
        const { disks: otherDisks } = fs;
        const { disks: myDisks } = this;
        for (const [k, v] of otherDisks) {
            myDisks.set(k, (myDisks.get(k) || new VFSDir(k, this)).merge(v));
        }
        return this;
    }

    *files(regexp?: RegExp): IterableIterator<VFSFile> {
        for (const disk of this.disks.values()) yield* disk.files(regexp);
    }

    async project(options: OpenProjectOptions = {}): Promise<RealPlayer> {
        let prjFile: VFSFile | undefined;
        {
            const matches = new Array<string>();

            const pathDosUC = options.path && splitPath(options.path).join("\\").toUpperCase();
            for (const v of this.files(/.+\.(prj|spj)$/i)) {
                if (pathDosUC && !v.pathDos.toUpperCase().includes(pathDosUC)) continue;
                prjFile = v;
                matches.push(v.pathDos);
            }
            if (matches.length > 1) throw Error(`Найдено несколько файлов проектов:\n${matches.join("\n")}`);
            if (!prjFile) throw Error("Не найдено файлов проектов");
        }

        const lib = new ClassLibrary();
        const res = await VFS.project(prjFile, lib);

        const addPaths = options.additionalClassPaths;
        if (addPaths) {
            const classDirs = new Set<VFSDir>();
            for (const p of addPaths) {
                const resolved = (this.disks.get(VFS.defaultPrefix) || res.dir).get(p);
                if (resolved?.dir) classDirs.add(resolved);
            }
            const defLib = await VFS.loadClasses(classDirs);
            lib.add(defLib);
        }

        return new RealPlayer(res);
    }
}
