import { VectorDrawing } from "/common/fileFormats/vdr/types/vectorDrawing";
import { NumBool } from "../types";
import { BinaryStream } from "/helpers/binaryStream";

export interface ProjectManager {
    readonly baseDirectory: string;
    readonly rootClassName: string;

    getClassDirectory(className: string): string;
    getClassScheme(className: string): VectorDrawing | undefined;
    hasClass(className: string): NumBool;

    openFileStream(path: string): BinaryStream | undefined;
    openVdrFile(path: string): VectorDrawing | undefined;
    isFileExist(path: string): NumBool;
}
