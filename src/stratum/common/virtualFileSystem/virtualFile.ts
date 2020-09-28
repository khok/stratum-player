import { BinaryStream } from "stratum/helpers/binaryStream";
import { unixToDosPath } from "stratum/helpers/pathOperations";
import { AsyncOpenError } from "stratum/common/errors";
import { JSZipObject } from "jszip";

interface DataSource {
    async(type: "arraybuffer"): Promise<ArrayBuffer>;
}

/**
 * Виртуальный файл с лениво подгружаемым (распакуемым) содержимым.
 */
export class VirtualFile {
    private bytes?: ArrayBuffer;
    private dataSource?: DataSource;

    readonly name: string;
    readonly lowerCaseName: string;

    private isAsync: boolean;

    get isAsyncLoaded() {
        return this.isAsync;
    }

    /**
     * Создает новый файл из `url` и именем `namne`
     */
    static fromUrl(url: string, name?: string) {
        const file = new VirtualFile(name || url);
        file.dataSource = {
            async: () => fetch(url).then((res) => res.arrayBuffer()),
        };
        return file;
    }

    /**
     * Создает новый файл из zip-объекта `zipObject` с именем `name`.
     */
    static fromZipObject(zipObject: JSZipObject, name: string) {
        const file = new VirtualFile(name);
        file.dataSource = zipObject;
        return file;
    }

    /**
     * Создает новый файл с именем `name` и опциональным содержмым `bytes`.
     */
    constructor(name: string, bytes?: ArrayBuffer) {
        this.name = unixToDosPath(name);
        this.lowerCaseName = this.name.toLowerCase();
        this.bytes = bytes;
        this.isAsync = !bytes;
    }

    async makeSync() {
        await this.arraybuffer();
        this.isAsync = false;
    }

    private async arraybuffer(): Promise<ArrayBuffer> {
        if (!this.bytes) {
            this.bytes = await this.dataSource!.async("arraybuffer");
            this.dataSource = undefined;
        }
        return this.bytes;
    }

    async openStream(): Promise<BinaryStream> {
        return new BinaryStream(await this.arraybuffer(), this.name);
    }

    openStreamSync(): BinaryStream {
        if (this.isAsync) throw new AsyncOpenError(this.name);
        return new BinaryStream(this.bytes!, this.name);
    }
}
