import { ZipFsOptions } from "stratum/api";
import { ZipFileSystem } from "stratum/vfs/zipFileSystem";

export function createZipFS(source: File | Blob | ArrayBuffer, options?: ZipFsOptions): Promise<ZipFileSystem> {
    return ZipFileSystem.fromData(source, options);
}
