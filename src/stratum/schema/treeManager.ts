import { ClassManager } from "stratum/vm/interfaces/classManager";
import { Schema } from "./schema";

export interface TreeManagerArgs {
    tree: Schema;
}

/**
 * Производит операции верхнего уровня над деревом имиджей (например, поиск всех имиджей определенного типа).
 * Реализует интерфейс `ClassManager` виртуальной машины.
 */
export class TreeManager implements ClassManager {
    private tree: Schema;

    private classNodes: Schema[];
    private classNodeCache = new Map<string, Schema[]>();

    constructor({ tree }: TreeManagerArgs) {
        this.tree = tree;
        this.classNodes = this.tree.getAllChildren();
    }

    /**
     * Возвращает все имиджи-узлы дерева, имеющие тип `className`.
     */
    getClassesByProtoName(className: string): Schema[] {
        const lcname = className.toLowerCase();
        const nodes = this.classNodeCache.get(lcname);
        if (nodes !== undefined) return nodes;
        const nodes2 = this.classNodes.filter((n) => n.protoNameLowCase === lcname);
        this.classNodeCache.set(className, nodes2);
        return nodes2;
    }
}
