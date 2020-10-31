import { ZipFsOptions } from "stratum/api";
import { VirtualFileSystem } from "./virtualFileSystem";

export { VirtualDir } from "./virtualDir";
export { VirtualFile } from "./virtualFile";
export { VirtualFileSystem };

export interface VirtualNode {
    readonly dir: boolean;
    readonly parent: VirtualNode;
    readonly pathDos: string;
}

export function createZipFS(source: File | Blob | ArrayBuffer, options?: ZipFsOptions): Promise<VirtualFileSystem> {
    return VirtualFileSystem.fromZip(source, options);
}
