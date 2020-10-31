import { VectorDrawing } from "stratum/fileFormats/vdr";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { NumBool } from "../types";

export interface ProjectManager {
    readonly rootClassName: string;

    getClassDirectory(className: string): string;
    getClassScheme(className: string): VectorDrawing | undefined;
    hasClass(className: string): NumBool;

    openFileStream(path: string): BinaryStream | undefined;
    openVdrFile(path: string): VectorDrawing | undefined;
    isFileExist(path: string): NumBool;
}
