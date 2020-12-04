import { VarType } from "stratum/fileFormats/cls";
import { MemorySize } from "stratum/translator";

export class VarGraphNode {
    private indexWasSet = false;
    private globalVarIdx = -1;
    private connectedNodes = new Set<VarGraphNode>();

    constructor(private readonly type: VarType) {}

    static connect(first: VarGraphNode, second: VarGraphNode) {
        if (first.type !== second.type) return false;
        if (first.indexWasSet || second.indexWasSet) {
            throw Error("Соединение уже инициализированных переменных не реализовано");
        }
        first.connectedNodes.add(second);
        second.connectedNodes.add(first);
        return true;
    }

    private shareIndex(index: number) {
        if (this.indexWasSet) return;
        this.indexWasSet = true;
        this.globalVarIdx = index;
        this.connectedNodes.forEach((n) => n.shareIndex(index));
    }

    getIndex(memSize: MemorySize): number {
        if (!this.indexWasSet) {
            switch (this.type) {
                case VarType.Float:
                    this.shareIndex(memSize.floatsCount++);
                    break;
                case VarType.Handle:
                case VarType.ColorRef:
                    this.shareIndex(memSize.intsCount++);
                    break;
                case VarType.String:
                    this.shareIndex(memSize.stringsCount++);
                    break;
            }
        }
        return this.globalVarIdx;
    }
}
