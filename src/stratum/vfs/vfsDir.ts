import { FileSystemDir } from "stratum/api";
import { getPathParts } from "stratum/helpers/pathOperations";
import { VFS, VFSFile } from ".";
import { LazyBuffer } from "./VFSFile";

const pathErr = (path: string) => Error(`Невозможно создать каталог ${path} - по этому пути уже существует файл.`);
export class VFSDir implements FileSystemDir {
    private readonly nodes = new Map<string, VFSDir | VFSFile>();

    readonly dir = true;
    readonly parent: VFSDir;
    readonly pathDos: string;

    constructor(private localName: string, private fs: VFS, parent?: VFSDir) {
        this.pathDos = parent ? parent.pathDos + "\\" + localName : localName;
        this.parent = parent || this;
    }

    private getFast(pp: string[]): VFSDir | VFSFile | undefined {
        const isAbsolute = pp[0].length === 2 && pp[0][1] === ":";

        let root: VFSDir = this;
        if (isAbsolute) {
            const d = this.fs.disk(pp[0][0]);
            if (!d) return undefined;
            if (pp.length === 1) return d; //Особый случай когда указан только диск.
            root = d;
        }

        for (let i = isAbsolute ? 1 : 0; i < pp.length - 1; i++) {
            if (pp[i] === "..") {
                root = root.parent;
            } else {
                const next = root.nodes.get(pp[i].toUpperCase());
                if (!next || !next.dir) return undefined;
                root = next;
            }
        }

        const last = pp[pp.length - 1];
        return last === ".." ? root.parent : root.nodes.get(last.toUpperCase());
    }

    get(path: string): VFSDir | VFSFile | undefined {
        const pp = getPathParts(path);
        return this.getFast(pp);
    }

    fileNew(name: string, data: ArrayBuffer): VFSFile | undefined {
        const pp = getPathParts(name);
        const fold = this.getFast(pp.slice(0, pp.length - 1));
        if (!fold) return undefined;
        const localName = pp[pp.length - 1];
        const keyUC = localName.toUpperCase();
        const { nodes } = this;
        if (nodes.get(keyUC)) return undefined;
        const f = new VFSFile(localName, data, this);
        nodes.set(keyUC, f);
        return f;
    }

    folderNew(name: string): VFSDir | undefined {
        const pp = getPathParts(name);
        const fold = this.getFast(pp.slice(0, pp.length - 1));
        if (!fold) return undefined;
        const localName = pp[pp.length - 1];
        const keyUC = localName.toUpperCase();
        const { nodes } = this;
        if (nodes.get(keyUC)) return undefined;
        const f = new VFSDir(localName, this.fs, this);
        nodes.set(keyUC, f);
        return f;
    }

    private setLocal(localName: string, fileOrDir: VFSDir | VFSFile) {
        const { nodes } = this;

        const prv = nodes.size;
        nodes.set(localName.toUpperCase(), fileOrDir);
        if (nodes.size === prv) throw Error(`Конфликт имен: ${fileOrDir.pathDos}`);
    }

    fileNewLocal(localName: string, source: LazyBuffer): VFSFile {
        const f = new VFSFile(localName, source, this);
        this.setLocal(localName, f);
        return f;
    }

    folderLocalGet(name: string): VFSDir | undefined {
        const res = this.get(name);
        return res && res.dir ? res : undefined;
    }

    folderLocal(localName: string): VFSDir {
        const { nodes } = this;
        const keyUC = localName.toUpperCase();

        const node = nodes.get(keyUC);
        if (node) {
            if (!node.dir) throw pathErr(node.pathDos);
            return node;
        }
        const fd = new VFSDir(localName, this.fs, this);
        nodes.set(keyUC, fd);
        return fd;
    }

    merge({ nodes: otherNodes }: VFSDir) {
        const { nodes: myNodes } = this;
        for (const [otherNameUC, otherNode] of otherNodes) {
            let thisNode = myNodes.get(otherNameUC);
            if (thisNode && !thisNode.dir) throw pathErr(thisNode.pathDos);
            if (otherNode.dir) {
                if (!thisNode) {
                    thisNode = new VFSDir(otherNode.localName, this.fs, this);
                    myNodes.set(otherNameUC, thisNode);
                }
                thisNode.merge(otherNode);
                continue;
            }
            if (thisNode) throw pathErr(thisNode.pathDos);
            myNodes.set(otherNameUC, otherNode.asSymlinkAt(this));
        }
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
        if (regexp) {
            for (const f of this._files()) if (regexp.test(f.pathDos)) yield f;
        } else {
            for (const f of this._files()) yield f;
        }
    }
}
