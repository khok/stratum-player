import { FileSystemFile } from "stratum/api";
import { ClassProto } from "stratum/common/classProto";
import { readBmpFile, readDbmFile } from "stratum/fileFormats/bmp";
import { FloatMatrix, readMatFile } from "stratum/fileFormats/mat";
import { ProjectInfo, readPrjFile } from "stratum/fileFormats/prj";
import { readSttFile, VariableSet } from "stratum/fileFormats/stt";
import { readVdrFile, VectorDrawing } from "stratum/fileFormats/vdr";
import { BinaryReader } from "stratum/helpers/binaryReader";
import { DibToolImage } from "stratum/helpers/types";
import { VFSDir } from ".";

export type LazyBuffer =
    | {
          async(type: "arraybuffer"): Promise<ArrayBuffer>;
      }
    | ArrayBuffer;

export class VFSFile implements FileSystemFile {
    private buf: LazyBuffer;
    readonly dir = false;
    readonly parent: VFSDir;
    readonly pathDos: string;

    constructor(private localName: string, parent: VFSDir, src: LazyBuffer) {
        this.buf = src;
        this.parent = parent;
        this.pathDos = parent.pathDos + "\\" + localName;
    }

    hardlink(parent: VFSDir, newLocalName?: string) {
        return new VFSFile(newLocalName || this.localName, parent, this.buf);
    }

    async arraybuffer(): Promise<ArrayBuffer> {
        if (!(this.buf instanceof ArrayBuffer)) this.buf = await this.buf.async("arraybuffer");
        return this.buf;
    }

    async makeSync(): Promise<void> {
        await this.arraybuffer();
    }

    write(data: ArrayBuffer): void {
        this.buf = data;
    }

    bufferSync() {
        if (this.buf instanceof ArrayBuffer) return this.buf;
        throw Error(`Файл ${this.pathDos} не был предзагружен.`);
    }

    private read(
        data: ArrayBuffer,
        type: "prj" | "cls" | "stt" | "vdr" | "mat" | "bmp" | "dbm"
    ): ProjectInfo | ClassProto | VariableSet | VectorDrawing | FloatMatrix | DibToolImage {
        const r = new BinaryReader(data, this.pathDos);
        switch (type) {
            case "prj":
                return readPrjFile(r);
            case "cls":
                return new ClassProto(r);
            case "stt":
                return readSttFile(r);
            case "vdr":
                return readVdrFile(r, { origin: "file", name: this.pathDos });
            case "mat":
                return readMatFile(r);
            case "bmp":
                return readBmpFile(r);
            case "dbm":
                return readDbmFile(r);
        }
    }

    readAs(type: "prj"): Promise<ProjectInfo>;
    readAs(type: "cls"): Promise<ClassProto>;
    readAs(type: "stt"): Promise<VariableSet>;
    readAs(type: "vdr"): Promise<VectorDrawing>;
    async readAs(type: "prj" | "cls" | "stt" | "vdr") {
        const s = await this.arraybuffer();
        return this.read(s, type);
    }

    private warnShowed = false;
    readSyncAs(type: "prj"): ProjectInfo | undefined;
    readSyncAs(type: "cls"): ClassProto | undefined;
    readSyncAs(type: "stt"): VariableSet | undefined;
    readSyncAs(type: "vdr"): VectorDrawing | undefined;
    readSyncAs(type: "mat"): FloatMatrix | undefined;
    readSyncAs(type: "bmp"): DibToolImage;
    readSyncAs(type: "dbm"): DibToolImage;
    readSyncAs(type: "prj" | "cls" | "stt" | "vdr" | "mat" | "bmp" | "dbm") {
        const buf = this.bufferSync();
        try {
            return this.read(buf, type);
        } catch (e) {
            if (!this.warnShowed) {
                console.warn(`${this.pathDos}: ошибка чтения.\nПричина: ${e.message}`);
                this.warnShowed = true;
            }
            return undefined;
        }
    }
}
