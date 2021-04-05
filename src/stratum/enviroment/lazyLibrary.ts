import { DirsInfo, FileInfo } from "stratum/api";
import { ClassLibrary, ClassProto } from "stratum/classLibrary";
import { Clearable } from "stratum/common/types";
import { ClassModel } from "stratum/compiler";
import { readClsFile, readClsHeader } from "stratum/fileFormats/cls";
import { BinaryReader } from "stratum/helpers/binaryReader";
import { getDirectory } from "stratum/helpers/pathOperations";

interface UnloadedClassInfo<T> {
    type: "unloaded";
    id: T | null;
    path: string;
    reader: BinaryReader;
}

interface LoadedClassInfo<T> {
    type: "loaded";
    id: T | null;
    path: string;
    proto: ClassProto;
}

export class LazyLibrary<T> implements ClassLibrary, Clearable<T> {
    private filenames = new Set<string>();
    private lib = new Map<string, UnloadedClassInfo<T> | LoadedClassInfo<T>>();

    async add(dirs: DirsInfo, recursive: boolean, id?: T): Promise<void> {
        const searchRes = await dirs.searchClsFiles(recursive);

        const files: FileInfo[] = [];
        for (let i = 0; i < searchRes.length; ++i) {
            const f = searchRes[i];
            const size = this.filenames.size;
            this.filenames.add(f.path);
            if (this.filenames.size !== size) files.push(searchRes[i]);
        }
        if (files.length === 0) return;

        const load = await dirs.files(files).arraybuffers();

        let clsTotalSize = 0;
        let clsCount = 0;
        for (let i = 0; i < load.length; ++i) {
            const buf = load[i];
            if (!buf) continue;

            const file = files[i];
            const reader = new BinaryReader(buf, file.path);
            let classname: string;
            try {
                classname = readClsHeader(reader).name;
            } catch (e) {
                console.warn(e.message);
                continue;
            }
            reader.seek(0);
            reader.name = `${classname} (${file.path})`;

            const keyUC = classname.toUpperCase();
            const exist = this.lib.get(keyUC);
            if (exist) {
                if (typeof id !== "undefined") this.clear(id);
                throw Error(`Имидж ${classname} обнаружен в файлах: ${exist.path}, ${file.path}`);
            }
            this.lib.set(keyUC, { type: "unloaded", id: id ?? null, path: file.path, reader });

            clsTotalSize += buf.byteLength;
            ++clsCount;
        }
        console.log(`Добавлено ${clsCount} имиджей объемом ${(clsTotalSize / 1024).toFixed()} КБ`);
    }

    clear(id: T): void {
        const data = [...this.lib];
        const res = data.filter((d) => d[1].id !== id);
        this.lib = new Map(res);
        const paths = res.map((r) => r[1].path);
        this.filenames = new Set(paths);
    }

    clearAll(): void {
        const data = [...this.lib];
        const res = data.filter((d) => d[1].id === null);
        this.lib = new Map(res);
        const paths = res.map((r) => r[1].path);
        this.filenames = new Set(paths);
    }

    has(className: string): boolean {
        return this.lib.has(className.toUpperCase());
    }
    get(className: string): ClassProto | null {
        const keyUC = className.toUpperCase();
        const res = this.lib.get(keyUC);
        if (!res) return null;
        if (res.type === "loaded") return res.proto;

        const info = readClsFile(res.reader);
        const proto = new ClassProto(info, this);
        this.lib.set(keyUC, { type: "loaded", id: res.id, path: res.path, proto });
        return proto;
    }
    getModel(className: string): ClassModel | null {
        return this.get(className)?.model() ?? null;
    }
    getDirectory(className: string): string | null {
        const res = this.lib.get(className.toUpperCase());
        return res ? getDirectory(res.path) : null;
    }
    getFileName(className: string): string | null {
        return this.lib.get(className.toUpperCase())?.path ?? null;
    }
}
