import { FileSystemFile } from "stratum/api";
import { ClassProto } from "stratum/common/classProto";
import { BytecodeParser } from "stratum/fileFormats/cls";
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

    constructor(private localName: string, src: LazyBuffer, parent: VFSDir) {
        this.buf = src;
        this.parent = parent;
        this.pathDos = parent.pathDos + "\\" + localName;
    }

    asSymlinkAt(parent: VFSDir, newLocalName?: string) {
        return new VFSFile(newLocalName || this.localName, this.buf, parent);
    }

    async arraybuffer(): Promise<ArrayBuffer> {
        if (!(this.buf instanceof ArrayBuffer)) this.buf = await this.buf.async("arraybuffer");
        return this.buf;
    }

    arraybufferSync(): ArrayBuffer | undefined {
        return this.buf instanceof ArrayBuffer ? this.buf : undefined;
    }

    async makeSync(): Promise<void> {
        await this.arraybuffer();
    }

    private read<TVmCode>(data: ArrayBuffer, type: "prj" | "cls" | "stt" | "vdr", bytecodeParser?: BytecodeParser<TVmCode>) {
        const stream = new BinaryStream(data, { filepathDos: this.pathDos });
        switch (type) {
            case "prj":
                return readPrjFile(stream);
            case "cls":
                return new ClassProto(stream, bytecodeParser);
            case "stt":
                return readSttFile(stream);
            case "vdr":
                const vdr = readVdrFile(stream);
                vdr.source = { origin: "file", name: this.pathDos };
                return vdr;
        }
    }

    readAs(type: "prj"): Promise<ProjectInfo>;
    readAs<TVmCode>(type: "cls", byteCodeParser?: BytecodeParser<TVmCode>): Promise<ClassProto<TVmCode>>;
    readAs(type: "stt"): Promise<VariableSet>;
    readAs(type: "vdr"): Promise<VectorDrawing>;
    async readAs<TVmCode>(type: "prj" | "cls" | "stt" | "vdr", bytecodeParser?: BytecodeParser<TVmCode>) {
        const s = await this.arraybuffer();
        return this.read(s, type, bytecodeParser);
    }

    readSyncAs(type: "prj"): ProjectInfo | undefined;
    readSyncAs<TVmCode>(type: "cls", byteCodeParser?: BytecodeParser<TVmCode>): ClassProto<TVmCode> | undefined;
    readSyncAs(type: "stt"): VariableSet | undefined;
    readSyncAs(type: "vdr"): VectorDrawing | undefined;
    readSyncAs<TVmCode>(type: "prj" | "cls" | "stt" | "vdr", bytecodeParser?: BytecodeParser<TVmCode>) {
        const buf = this.arraybufferSync();
        return buf && this.read(buf, type, bytecodeParser);
    }
}
