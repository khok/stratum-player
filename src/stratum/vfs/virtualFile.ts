import { FileSystemFile } from "stratum/api";
import { dosPath } from "stratum/helpers/pathOperations";

export type LazyBuffer =
    | {
          async(type: "arraybuffer"): Promise<ArrayBuffer>;
      }
    | ArrayBuffer;

function bufferLoaded(src: LazyBuffer): src is ArrayBuffer {
    return src instanceof ArrayBuffer;
}

export class DataSource {
    constructor(private src: LazyBuffer) {}

    async open(): Promise<ArrayBuffer> {
        if (!bufferLoaded(this.src)) {
            this.src = await this.src.async("arraybuffer");
        }
        return this.src;
    }

    openSync(): ArrayBuffer | undefined {
        if (!bufferLoaded(this.src)) return undefined;
        return this.src;
    }
}

export class VirtualFile implements FileSystemFile {
    static fromUrl(req: RequestInfo, path?: string) {
        const src = new DataSource({ async: () => fetch(req).then((res) => res.arrayBuffer()) });
        return new VirtualFile(path || req.toString(), src);
    }

    private src: DataSource;

    readonly path: string;
    readonly pathDos: string;
    readonly pathDosUC: string;

    constructor(unixPath: string, dataSource: DataSource) {
        this.path = unixPath;
        this.pathDos = dosPath(unixPath);
        this.pathDosUC = this.pathDos.toUpperCase();
        this.src = dataSource;
    }

    as(path: string): VirtualFile {
        return new VirtualFile(path, this.src);
    }

    arraybuffer(): Promise<ArrayBuffer> {
        return this.src.open();
    }

    async makeSync(): Promise<void> {
        await this.src.open();
    }

    arrayBufferSync(): ArrayBuffer {
        const src = this.src.openSync();
        if (!src) throw Error(`Содержимое файла ${this.path} не было предзагружено.`);
        return src;
    }
}
