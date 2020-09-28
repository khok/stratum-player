import { UsageError } from "stratum/common/errors";
import { VarCode } from "stratum/common/varCode";
import { TreeMemoryManagerArgs } from "./treeMemoryManager";

export class VarGraphNode {
    private indexWasSet = false;
    private globalVarIdx = -1;
    private connectedNodes = new Set<VarGraphNode>();

    constructor(private readonly type: VarCode) {}

    static connect(first: VarGraphNode, second: VarGraphNode) {
        if (first.type !== second.type) return false;
        if (first.indexWasSet || second.indexWasSet) {
            throw new UsageError("Соединение уже инициализированных переменных не реализовано");
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

    getIndex(mmanagerArgs: TreeMemoryManagerArgs): number {
        if (!this.indexWasSet) {
            switch (this.type) {
                case VarCode.Float:
                    this.shareIndex(mmanagerArgs.floatsCount++);
                    break;
                case VarCode.Handle:
                case VarCode.ColorRef:
                    this.shareIndex(mmanagerArgs.longsCount++);
                    break;
                case VarCode.String:
                    this.shareIndex(mmanagerArgs.stringsCount++);
                    break;
            }
        }
        return this.globalVarIdx;
    }
}
