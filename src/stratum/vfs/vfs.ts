import { loadAsync } from "jszip";
import { FS, OpenProjectOptions, OpenZipOptions, ZipSource } from "stratum/api";
import { ProjectClassLibrary } from "stratum/common/classLibrary";
import { getPrefixAndPathParts, SLASHES, splitPath } from "stratum/helpers/pathOperations";
import { RealPlayer } from "stratum/player";
import { loadClasses, loadProject, VFSDir, VFSFile } from ".";

export class VFS implements FS {
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

    private readonly disks = new Map<string, VFSDir>();
    disk(name: string) {
        return this.disks.get(name.toUpperCase());
    }

    merge(fs: FS): this {
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

        const res = await loadProject(prjFile);

        const addPaths = options.additionalClassPaths;
        let add: ProjectClassLibrary | undefined;
        if (addPaths) {
            const classDirs = new Set<VFSDir>();
            for (const p of addPaths) {
                const resolved = (this.disks.get(VFS.defaultPrefix) || res.dir).get(p);
                if (resolved?.dir) classDirs.add(resolved);
            }
            add = await loadClasses(classDirs);
        }

        return new RealPlayer(res, add);
    }
}
