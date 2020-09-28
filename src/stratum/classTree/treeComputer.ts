import { EventDispatcher } from "/common/eventDispatcher";
import { ExecutionContext } from "/vm/executionContext";
import { TreeMemoryManager } from "./treeMemoryManager";
import { TreeNode } from "./treeNode";

export interface TreeComputerArgs {
    tree: TreeNode;
    mmanager: TreeMemoryManager;
    dispatcher?: EventDispatcher;
}

export class TreeComputer {
    private tree: TreeNode;
    private mmanager: TreeMemoryManager;
    private dispatcher?: EventDispatcher;

    constructor({ tree, mmanager, dispatcher }: TreeComputerArgs) {
        this.tree = tree;
        this.mmanager = mmanager;
        this.dispatcher = dispatcher;
        mmanager.initValues();
    }

    /**
     * Вычисляет все дерево имиджей и синхронизирует старые и новые значения MemoryManager-а.
     */
    compute(ctx: ExecutionContext): boolean {
        this.tree.compute(ctx);
        if (ctx.executionStopped) {
            if (this.dispatcher) {
                if (ctx.error) this.dispatcher.dispatch("VM_ERROR", ctx.error);
                else this.dispatcher.dispatch("PROJECT_STOPPED");
            }
            return false;
        }
        this.mmanager.syncValues();
        this.mmanager.assertZeroIndexEmpty();
        return true;
    }
}
