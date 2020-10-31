import { VirtualFile, VirtualNode } from ".";
import { VirtualFileContent } from "./virtualFileContent";

export class VirtualDir implements VirtualNode {
    private readonly nodes = new Map<string, VirtualDir | VirtualFile>();

    readonly dir = true;
    readonly parent: VirtualDir;
    readonly pathDos: string;

    constructor(private name: string, parent?: VirtualDir) {
        this.pathDos = parent ? parent.pathDos + "\\" + name : name;
        this.parent = parent || this;
    }

    private insert(name: string, fileOrDir: VirtualDir | VirtualFile) {
        const { nodes } = this;

        const prv = nodes.size;
        nodes.set(name.toUpperCase(), fileOrDir);
        if (nodes.size === prv) throw Error(`Конфликт имен: ${fileOrDir.pathDos}`);
    }

    get(name: string): VirtualFile | VirtualDir | undefined {
        return this.nodes.get(name.toUpperCase());
    }

    fileGet(name: string): VirtualFile | undefined {
        const res = this.get(name);
        return res && !res.dir ? res : undefined;
    }

    fileNew(name: string, source: VirtualFileContent): VirtualFile {
        const f = new VirtualFile(name, source, this);
        this.insert(name, f);
        return f;
    }

    folderNew(name: string): VirtualDir {
        const fd = new VirtualDir(name, this);
        this.insert(name, fd);
        return fd;
    }

    folderGet(name: string): VirtualDir | undefined {
        const res = this.get(name);
        return res && res.dir ? res : undefined;
    }

    folder(name: string): VirtualDir {
        const { nodes } = this;
        const keyUC = name.toUpperCase();

        const node = nodes.get(keyUC);
        if (node) {
            if (!node.dir) throw Error(`Файл ${node.pathDos} уже существует.`);
            return node;
        }
        const fd = new VirtualDir(name, this);
        nodes.set(keyUC, fd);
        return fd;
    }

    merge({ nodes: otherNodes }: VirtualDir) {
        const { nodes: myNodes } = this;
        for (const [otherNameUC, otherNode] of otherNodes) {
            let thisNode = myNodes.get(otherNameUC);
            if (thisNode && !thisNode.dir) throw Error(`Конфликт имен: ${thisNode.pathDos}`);
            if (otherNode.dir) {
                if (!thisNode) {
                    thisNode = new VirtualDir(otherNode.name, this);
                    myNodes.set(otherNameUC, thisNode);
                }
                thisNode.merge(otherNode);
                continue;
            }
            if (thisNode) throw Error(`Конфликт имен: ${thisNode.pathDos}`);
            myNodes.set(otherNameUC, otherNode.makeCopyAt(this));
        }
    }

    *files(): IterableIterator<VirtualFile> {
        for (const subnode of this.nodes.values()) {
            if (!subnode.dir) {
                yield subnode;
                continue;
            }
            for (const subfile of subnode.files()) {
                yield subfile;
            }
        }
    }

    *search(regexp: RegExp): IterableIterator<VirtualFile> {
        for (const f of this.files()) if (regexp.test(f.pathDos)) yield f;
    }
}
