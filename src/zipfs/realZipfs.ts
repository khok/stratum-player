import { loadAsync } from "jszip";
import { OpenZipOptions, PathInfo, ZipFS, ZipSource } from "stratum";
import { PathObject } from "./pathObject";
import { ZipDir } from "./zipDir";

export class RealZipFS implements ZipFS {
    static async create(source: ZipSource, options: OpenZipOptions = {}): Promise<RealZipFS> {
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

        const fs = new RealZipFS();

        const rpath = fs.path(options.directory ?? "");
        let root = new ZipDir(rpath.vol, fs);
        fs.disks.set(rpath.vol.toUpperCase(), root);
        for (const p of rpath.parts) root = root.createLocalDir(p);

        zip.forEach((path, zipObj) => {
            const p2 = path.split(/[/\\]/);
            let fd = root;
            for (let i = 0; i < p2.length - 1; ++i) fd = fd.createLocalDir(p2[i]);
            if (!zipObj.dir) fd.createLocalFile(p2[p2.length - 1], zipObj);
        });
        return fs;
    }

    private readonly disks = new Map<string, ZipDir>();
    merge(fs: RealZipFS): this {
        const { disks: otherDisks } = fs;
        const { disks: myDisks } = this;
        for (const [k, v] of otherDisks) {
            myDisks.set(k, (myDisks.get(k) || new ZipDir(k, this)).merge(v));
        }
        return this;
    }

    *files(regexp?: RegExp): IterableIterator<PathInfo> {
        for (const disk of this.disks.values()) yield* disk.files(regexp, true);
    }

    private get(path: PathInfo) {
        return this.disks.get(path.vol.toUpperCase())?.get(path.parts);
    }

    path(path: string): PathInfo {
        return new PathObject(this).resolve(path);
    }

    // Реализация FileSystem
    searchClsFiles(paths: PathInfo[], recursive: boolean): Promise<PathInfo[]> {
        // console.log(paths.join("\n"));
        const result: PathInfo[] = [];
        for (let i = 0; i < paths.length; ++i) {
            const dir = this.get(paths[i]);
            if (!dir?.isDir) continue;
            result.push(...dir.files(/.+\.cls$/i, recursive));
        }
        return Promise.resolve(result);
    }
    arraybuffers(paths: PathInfo[]): Promise<(ArrayBuffer | ArrayBufferView | null)[]> {
        // console.log(paths.join("\n"));
        const result: Promise<ArrayBuffer>[] = [];
        for (let i = 0; i < paths.length; ++i) {
            const file = this.get(paths[i]);
            if (!file || file.isDir) continue;
            result.push(file.arraybuffer());
        }
        return Promise.all(result);
    }
    createDir(path: PathInfo): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    fileExist(path: PathInfo): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    arraybuffer(path: PathInfo): Promise<ArrayBuffer | ArrayBufferView | null> {
        // console.log(path.toString());
        const file = this.get(path);
        if (!file || file.isDir) return Promise.resolve(null);
        return file.arraybuffer();
    }
    createFile(path: PathInfo): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    write(path: PathInfo, data: ArrayBuffer): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
}
