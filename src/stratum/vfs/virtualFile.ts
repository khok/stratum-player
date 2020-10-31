import { FileSystemFile } from "stratum/api";
import { ClassProto } from "stratum/common/classProto";
import { BytecodeParser } from "stratum/fileFormats/cls";
import { ProjectInfo, readPrjFile } from "stratum/fileFormats/prj";
import { readSttFile, VariableSet } from "stratum/fileFormats/stt";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { VirtualDir, VirtualNode } from ".";
import { VirtualFileContent } from "./virtualFileContent";

export class VirtualFile implements FileSystemFile, VirtualNode {
    private src: VirtualFileContent;

    readonly dir = false;
    readonly parent: VirtualDir;
    readonly pathDos: string;

    constructor(private name: string, dataSource: VirtualFileContent, parent: VirtualDir) {
        this.src = dataSource;
        this.parent = parent;
        this.pathDos = parent.pathDos + "\\" + name;
    }

    get directoryDos() {
        return this.parent.pathDos;
    }

    makeCopyAt(parent: VirtualDir) {
        return new VirtualFile(this.name, this.src, parent);
    }

    arraybuffer(): Promise<ArrayBuffer> {
        return this.src.open();
    }

    async makeSync(): Promise<void> {
        await this.src.open();
    }

    private async stream() {
        const data = await this.arraybuffer();
        return new BinaryStream(data, { filepathDos: this.pathDos });
    }

    streamSync(): BinaryStream {
        const data = this.src.openSync();
        if (!data) throw Error(`Содержимое файла ${this.pathDos} не было предзагружено.`);
        return new BinaryStream(data, { filepathDos: this.pathDos });
    }

    readAs(type: "prj"): Promise<ProjectInfo>;
    readAs<TVmCode>(type: "cls", byteCodeParser?: BytecodeParser<TVmCode>): Promise<ClassProto<TVmCode>>;
    readAs(type: "stt"): Promise<VariableSet>;
    async readAs<TVmCode>(type: "prj" | "cls" | "stt", bytecodeParser?: BytecodeParser<TVmCode>) {
        const stream = await this.stream();
        switch (type) {
            case "prj":
                return readPrjFile(stream);
            case "cls":
                return new ClassProto(stream, { bytecodeParser });
            case "stt":
                return readSttFile(stream);
        }
    }
}
