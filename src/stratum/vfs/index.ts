import { ZipFsOptions } from "stratum/api";
import { ZipFileSystem } from "stratum/vfs/zipFileSystem";

export function createZipFS(source: Blob | ArrayBuffer, options?: ZipFsOptions): Promise<ZipFileSystem> {
    return ZipFileSystem.new(source, options);
}
