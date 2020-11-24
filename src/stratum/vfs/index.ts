import { OpenZipOptions } from "stratum/api";
import { VFS } from "./vfs";

export { VFS } from "./vfs";
export { VFSDir } from "./vfsDir";
export { VFSFile } from "./vfsFile";

export function createZipFS(source: File | Blob | ArrayBuffer | Uint8Array, options?: OpenZipOptions): Promise<VFS> {
    return VFS.fromZip(source, options);
}
