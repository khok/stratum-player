import { OpenZipOptions, ZipSource } from "stratum/api";
import { VFS } from "./vfs";

export { loadClasses, loadProject, ProjectResources } from "./helpers";
export { VFS } from "./vfs";
export { VFSDir } from "./vfsDir";
export { VFSFile } from "./vfsFile";

export function createZipFS(source: ZipSource, options?: OpenZipOptions): Promise<VFS> {
    return VFS.fromZip(source, options);
}
