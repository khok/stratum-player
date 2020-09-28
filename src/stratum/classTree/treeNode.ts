import { UsageError } from "/common/errors";
import { VariableSet } from "/common/fileFormats/stt";
import { VarCode } from "/common/varCode";
import { parseVarValue } from "/common/varParsers";
import { ClassPrototype } from "/common/classPrototype";
import { Point2D } from "/helpers/types";
import { executeCode } from "/vm/executeCode";
import { ExecutionContext } from "/vm/executionContext";
import { ComputableClass, ComputableClassVars } from "/vm/interfaces/computableClass";
import { TreeMemoryManager, TreeMemoryManagerArgs } from "./treeMemoryManager";
import { VarGraphNode } from "./varGraphNode";
import { NodeCode } from "./nodeCode";

const disabledDefault = () => false;

/**
 * Описание размещения имиджа на схеме.
 */
export interface PlacementDescription {
    parent: TreeNode;
    handle: number;
    position: Point2D;
    name: string;
}

export interface TreeVars extends ComputableClassVars {
    mmanager: TreeMemoryManager;
}

export interface TreeNodeArgs {
    proto: ClassPrototype<NodeCode>;
    placement?: PlacementDescription;
}

export class TreeNode implements ComputableClass {
    private varGraphNodes: VarGraphNode[];
    private captureEventsFromSpace = 0;
    private neighbourMap: Map<string, TreeNode>;
    readonly proto: ClassPrototype<NodeCode>;
    private placement?: PlacementDescription;
    private isDisabled: () => boolean = disabledDefault;

    private root: TreeNode;
    private _canReceiveEvents: boolean = false;

    private children?: TreeNode[];

    private variablesCreated = false;

    vars?: TreeVars;

    readonly protoName: string;
    readonly protoNameLowCase: string;

    constructor({ proto, placement }: TreeNodeArgs) {
        this.proto = proto;
        this.protoName = proto.name;
        this.protoNameLowCase = proto.name.toLowerCase();
        this.placement = placement;

        this.varGraphNodes = proto.vars ? proto.vars.typeCodes.map((t) => new VarGraphNode(t)) : [];

        let root: TreeNode = this;
        while (root.placement && root.placement.parent !== root) root = root.placement.parent;
        this.root = root;

        this.neighbourMap = new Map([
            ["", this],
            ["\\", this.root],
        ]);
        const parent = placement && placement.parent;
        if (parent) this.neighbourMap.set("..", parent);
    }

    setChildren(children: TreeNode[]) {
        if (this.children) throw new UsageError("Изменение подимиджей не реализовано");
        this.children = children;

        children.forEach((c) => {
            const name = c.placement && c.placement.name;
            if (name) this.neighbourMap.set(name.toLowerCase(), c);
        });
    }

    getChild(handle: number): TreeNode | undefined {
        return this.children && this.children.find((c) => c.placement!.handle === handle);
    }

    static connectVar(first: TreeNode, firstId: number, second: TreeNode, secondId: number) {
        return VarGraphNode.connect(first.varGraphNodes[firstId], second.varGraphNodes[secondId]);
    }

    /**
     * Рекурсивно создает переменные имиджа и всех подимиджей.
     *
     * Необходимо применять к корню схемы после установки всех связей.
     */
    private createVarsRecursive(mmanagerArgs: TreeMemoryManagerArgs, mmanager: TreeMemoryManager) {
        this.variablesCreated = true;
        if (this.children) this.children.forEach((c) => c.createVarsRecursive(mmanagerArgs, mmanager));

        if (!this.proto.vars) return;

        const vars: TreeVars = {
            nameToIdMap: this.proto.vars.varNameToId,
            typeCodes: this.proto.vars.typeCodes,
            names: this.proto.vars.names,
            globalIds: new Uint16Array(this.varGraphNodes.map((v) => v.getIndex(mmanagerArgs))),
            mmanager,
        };

        const enableId = vars.nameToIdMap.get("_enable");
        const disableId = vars.nameToIdMap.get("_disable");
        const msgId = vars.nameToIdMap.get("msg");

        if (enableId !== undefined && vars.typeCodes[enableId] === VarCode.Float) {
            if (disableId === undefined || vars.typeCodes[disableId] !== VarCode.Float || enableId < disableId) {
                const id = vars.globalIds[enableId];
                this.isDisabled = () => mmanager.newDoubleValues[id] < 1;
            }
        }

        if (disableId !== undefined && vars.typeCodes[disableId] === VarCode.Float) {
            if (enableId === undefined || vars.typeCodes[enableId] !== VarCode.Float || disableId < enableId) {
                const id = vars.globalIds[disableId];
                this.isDisabled = () => mmanager.newDoubleValues[id] > 0;
            }
        }

        this._canReceiveEvents = msgId !== undefined && vars.typeCodes[msgId] === VarCode.Float;
        this.vars = vars;
    }

    /**
     * Инициализирует значения переменных по умолчанию.
     *
     * Необходимо применять к корню схемы.
     *
     * Замечание: Значения родительского имиджа превыше дочерних, поэтому они применяются последними.
     */
    private applyDefaultValuesRecursive() {
        if (this.children) this.children.forEach((c) => c.applyDefaultValuesRecursive());

        if (!this.proto.vars || !this.vars) return;
        const varCount = this.vars.globalIds.length;
        for (let localIdx = 0; localIdx < varCount; localIdx++) {
            const defaultValue = this.proto.vars.defaultValues[localIdx];
            const type = this.vars.typeCodes[localIdx];
            const name = this.vars.names[localIdx].toLowerCase();

            let defValue: number | string | undefined;

            //Значение по умолчанию
            if (defaultValue !== undefined) {
                defValue = defaultValue;
            } else {
                //Если знач. по умолчанию нет, пытаемся получить специальное значение переменной.
                if (type === VarCode.Float) {
                    if (name === "orgx") defValue = this.placement && this.placement.position.x;
                    else if (name === "orgy") defValue = this.placement && this.placement.position.y;
                } else if (type === VarCode.String) {
                    if (name === "_objname") defValue = this.placement && this.placement.name;
                    else if (name === "_classname") defValue = this.proto.name;
                } else if (type === VarCode.Handle && name === "_hobject") defValue = this.placement && this.placement.handle;
            }

            if (defValue !== undefined) {
                this.vars.mmanager.getDefaultValues(this.vars.typeCodes[localIdx])[this.vars.globalIds[localIdx]] = defValue;
            }
        }
    }

    /**
     * Инициализирует память всего дерева и возвращает экземпляр `MemoryManager`.
     *
     * Необходимо вызывать после проведения всех связей.
     */
    createMemoryManager() {
        if (this.vars && this.vars.mmanager) return this.vars.mmanager;

        const mmanagerArgs: TreeMemoryManagerArgs = {
            floatsCount: 1,
            longsCount: 1,
            stringsCount: 1,
        };
        const mmanager = new TreeMemoryManager();
        this.createVarsRecursive(mmanagerArgs, mmanager);
        mmanager.createBuffers(mmanagerArgs);
        this.applyDefaultValuesRecursive();
        return mmanager;
    }

    /**
     * Применяет к дереву имиджей набор переменных `varSet`, считанных из .stt файла.
     *
     * Замечание: Значения дочерних превыше родительских, поэтому они применяются последними.
     */
    applyVarSet(varSet: VariableSet) {
        if (!this.variablesCreated) throw new UsageError("Память имиджей не инициализирована (сперва вызови createMemoryManager)");
        // const handleMatch = !this.onSchemeData || this.onSchemeData.handle === varSet.handle;
        if (this.vars && this.protoNameLowCase === varSet.classname.toLowerCase()) {
            for (const { name, value } of varSet.values) {
                const varId = this.vars.nameToIdMap.get(name.toLowerCase());
                if (varId === undefined) continue;
                const typeCode = this.vars.typeCodes[varId];
                const globalId = this.vars.globalIds[varId];
                this.vars.mmanager.getDefaultValues(typeCode)[globalId] = parseVarValue(typeCode, value);
            }
        }

        if (this.children) {
            for (const childSet of varSet.childSets) {
                const child = this.children.find((c) => c.placement && c.placement.handle === childSet.handle);
                if (child) child.applyVarSet(childSet);
            }
        }
    }

    getClassByPath(path: string): TreeNode | undefined {
        if (path === "") return this;
        const filter = path.split("\\");
        let root = path[0] === "\\" ? this.root : this;
        for (let i = 0; i < filter.length; i++) {
            const cl = root.neighbourMap.get(filter[i]);
            if (cl === undefined) return undefined;
            root = cl;
        }
        return root;
    }

    getAllChildren() {
        const collectNodes = (par: TreeNode, nodes: TreeNode[]) => {
            if (par.children) par.children.forEach((c) => collectNodes(c, nodes));
            nodes.push(par);
        };
        const nodes = new Array<TreeNode>();
        collectNodes(this, nodes);
        return nodes;
    }

    startCaptureEvents(spaceHandle: number): void {
        this.captureEventsFromSpace = spaceHandle;
    }

    get canReceiveEvents(): boolean {
        return this._canReceiveEvents;
    }

    stopCaptureEvents(): void {
        this.captureEventsFromSpace = 0;
    }

    isCapturingEvents(spaceHandle: number): boolean {
        return this.captureEventsFromSpace === spaceHandle;
    }

    toCompactString() {
        return `${this.placement ? "#" + this.placement.handle + " " : ""}${this.proto.name}`;
    }

    compute(ctx: ExecutionContext, force: boolean = false): void {
        if (ctx.hasError || (force === false && this.isDisabled())) return;

        const children = this.children;
        if (children) for (let i = 0; i < children.length; i++) children[i].compute(ctx);

        const code = this.proto.code;
        if (code === undefined) return;

        const prevCmdIdx = ctx.nextOpPointer;
        const prevClass = ctx.currentClass;

        ctx.pushClass(this);
        executeCode(ctx, code);

        ctx.popClass(prevClass);
        ctx.nextOpPointer = prevCmdIdx;
    }
}
