import { FileSystemFile } from "stratum/api";
import { ClassProto } from "stratum/common/classProto";
import { Base64Image, readBmpFile, readDbmFile } from "stratum/fileFormats/bmp";
import { ProjectInfo, readPrjFile } from "stratum/fileFormats/prj";
import { readSttFile, VariableSet } from "stratum/fileFormats/stt";
import { readVdrFile, VectorDrawing } from "stratum/fileFormats/vdr";
import { BinaryStream } from "stratum/helpers/binaryStream";
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

    constructor(private localName: string, parent: VFSDir, src?: LazyBuffer) {
        this.buf = src || new ArrayBuffer(0);
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

    private cache?: ReturnType<VFSFile["read"]>;
    private read(data: ArrayBuffer, type: "prj" | "cls" | "stt" | "vdr" | "bmp" | "dbm"): ProjectInfo | ClassProto | VariableSet | VectorDrawing | Base64Image {
        if (this.cache) return this.cache;
        const st = new BinaryStream(data, { filepathDos: this.pathDos });
        switch (type) {
            case "prj":
                return (this.cache = readPrjFile(st));
            case "cls":
                return (this.cache = new ClassProto(st));
            case "stt":
                return (this.cache = readSttFile(st));
            case "vdr": {
                const vdr = (this.cache = readVdrFile(st));
                vdr.source = { origin: "file", name: this.pathDos };
                if (st.position !== st.size) {
                    const msg = `${this.pathDos}: считано ${st.position} байтов, не считано ${st.size - st.position}. v0x${
                        st.meta.fileversion && st.meta.fileversion.toString(16)
                    }.`;
                    console.warn(msg);
                }
                return vdr;
            }
            case "bmp":
                return (this.cache = readBmpFile(st));
            case "dbm":
                return (this.cache = readDbmFile(st));
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

    private startLoading = false;
    private warnShowed = false;
    readSyncAs(type: "prj"): ProjectInfo | undefined;
    readSyncAs(type: "cls"): ClassProto | undefined;
    readSyncAs(type: "stt"): VariableSet | undefined;
    readSyncAs(type: "vdr"): VectorDrawing | undefined;
    readSyncAs(type: "bmp"): Base64Image;
    readSyncAs(type: "dbm"): Base64Image;
    readSyncAs(type: "prj" | "cls" | "stt" | "vdr" | "bmp" | "dbm") {
        const { buf } = this;
        if (!(buf instanceof ArrayBuffer)) {
            if (this.startLoading) return undefined;
            this.startLoading = true;
            buf.async("arraybuffer").then((b) => (this.buf = b));
            console.warn(`${this.pathDos} загружается асинхронно.`);
            return undefined;
        }
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
