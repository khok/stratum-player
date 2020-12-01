import { FileSystemDir, FileSystemFileData } from "stratum/api";
import { assertDiskPrefix, splitPath } from "stratum/helpers/pathOperations";
import { VFS, VFSFile } from ".";
import { LazyBuffer } from "./vfsFile";

const pathErr = (path: string) => Error(`Невозможно создать каталог ${path} - по этому пути уже существует файл.`);
export class VFSDir implements FileSystemDir {
    private readonly nodes = new Map<string, VFSDir | VFSFile>();
    private readonly fs: VFS;

    readonly dir = true;
    readonly parent: VFSDir;
    readonly pathDos: string;

    constructor(private localName: string, parent: VFS | VFSDir) {
        if (parent instanceof VFSDir) {
            this.fs = parent.fs;
            this.parent = parent;
            this.pathDos = parent.pathDos + "\\" + localName;
        } else {
            this.fs = parent;
            this.parent = this;
            assertDiskPrefix(localName);
            this.pathDos = this.localName = localName + ":";
        }
    }

    private resolve(pp: string[]): VFSDir | VFSFile | undefined {
        if (pp.length === 0) return undefined;
        const isAbsolute = pp[0].length === 2 && pp[0][1] === ":";

        let root: VFSDir;
        if (isAbsolute) {
            const d = this.fs.disk(pp[0][0]);
            if (pp.length === 1) return d; //Особый случай когда указан только диск.
            if (d === undefined) return undefined;
            root = d;
        } else {
            root = this;
        }

        for (let i = isAbsolute ? 1 : 0; i < pp.length - 1; i++) {
            if (pp[i] === "..") {
                root = root.parent;
            } else {
                const next = root.nodes.get(pp[i].toUpperCase());
                if (!next?.dir) return undefined;
                root = next;
            }
        }

        const last = pp[pp.length - 1];
        return last === ".." ? root.parent : root.nodes.get(last.toUpperCase());
    }

    get(path: string): VFSDir | VFSFile | undefined {
        return this.resolve(splitPath(path));
    }

    create(type: "file", path: string, data?: FileSystemFileData): VFSFile | undefined;
    create(type: "dir", path: string): VFSDir | undefined;
    create(type: "file" | "dir", path: string, data?: FileSystemFileData): VFSFile | VFSDir | undefined {
        const pp = splitPath(path);
        const where = this.resolve(pp.slice(0, pp.length - 1));
        if (!where?.dir) return undefined;

        const localName = pp[pp.length - 1];
        const keyUC = localName.toUpperCase();

        const existingNode = where.nodes.get(keyUC);
        if (existingNode) return existingNode.dir && type === "dir" ? existingNode : undefined;

        const f = type === "file" ? new VFSFile(localName, where, data) : new VFSDir(localName, where);
        where.nodes.set(keyUC, f);
        return f;
    }

    private setLocalSafe(localName: string, fileOrDir: VFSDir | VFSFile) {
        const { nodes } = this;
        const prv = nodes.size;
        nodes.set(localName.toUpperCase(), fileOrDir);
        if (nodes.size === prv) throw Error(`Конфликт имен: ${fileOrDir.pathDos}`);
    }

    createLocalFile(name: string, source: LazyBuffer): void {
        const f = new VFSFile(name, this, source);
        this.setLocalSafe(name, f);
    }

    createLocalDir(name: string): VFSDir {
        const { nodes } = this;
        const keyUC = name.toUpperCase();

        const node = nodes.get(keyUC);
        if (node) {
            if (node.dir) return node;
            throw pathErr(node.pathDos);
        }
        const d = new VFSDir(name, this);
        nodes.set(keyUC, d);
        return d;
    }

    merge({ nodes: otherNodes }: VFSDir): this {
        const { nodes: myNodes } = this;
        for (const [otherNameUC, otherNode] of otherNodes) {
            let thisNode = myNodes.get(otherNameUC);
            if (thisNode && !thisNode.dir) throw pathErr(thisNode.pathDos);
            if (otherNode.dir) {
                if (!thisNode) {
                    thisNode = new VFSDir(otherNode.localName, this);
                    myNodes.set(otherNameUC, thisNode);
                }
                thisNode.merge(otherNode);
                continue;
            }
            if (thisNode) throw pathErr(thisNode.pathDos);
            myNodes.set(otherNameUC, otherNode.hardlink(this));
        }
        return this;
    }

    private *_files(): IterableIterator<VFSFile> {
        for (const subnode of this.nodes.values()) {
            if (!subnode.dir) {
                yield subnode;
                continue;
            }
            for (const subfile of subnode._files()) {
                yield subfile;
            }
        }
    }

    *files(regexp?: RegExp): IterableIterator<VFSFile> {
        if (!regexp) return this._files();
        for (const f of this._files()) if (regexp.test(f.pathDos)) yield f;
    }
}
