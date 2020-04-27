import { VarData, VarSetData } from "cls-types";
import { Point2D } from "vdr-types";
import { ClassState } from "vm-interfaces-core";
import { ParsedCode } from "vm-types";
import { StratumError } from "~/helpers/errors";
import { HandleMap } from "~/helpers/handleMap";
import { parseVarValue } from "~/helpers/varValueFunctions";
import { executeCode } from "~/vm/executeCode";
import { VmContext } from "~/vm/vmContext";
import { ClassPrototype } from "./classPrototype";
import { MemoryManager } from "./memoryManager";

export interface OnSchemeData {
    parent: ClassTreeNode;
    handle: number;
    position: Point2D;
    name: string;
}

export interface ClassTreeNodeOptions {
    proto: ClassPrototype;
    varIndexMap?: { globalIdx: number; type: VarData["type"] }[];
    onSchemeData?: OnSchemeData;
}

export class ClassTreeNode implements ClassState {
    private static createDisableGetter(ci: ClassTreeNode): () => boolean {
        const enableVarid = ci.varnameToIdMap!.get("_enable");
        const disableVarId = ci.varnameToIdMap!.get("_disable");

        let res = () => false;

        if (enableVarid !== undefined) res = () => ci.mmanager!.newDoubleValues[ci.doubleIdToGlobal![enableVarid]] < 1;

        if (disableVarId !== undefined) {
            const disableVarPriority = enableVarid === undefined || disableVarId < enableVarid;
            if (disableVarPriority) res = () => ci.mmanager!.newDoubleValues[ci.doubleIdToGlobal![disableVarId]] > 0;
        }
        return res;
    }

    private proto: ClassPrototype;

    private mmanager?: MemoryManager;
    private isDisabled: () => boolean;
    private root: ClassTreeNode;
    private parent?: ClassTreeNode;
    private childs?: ClassTreeNode[];
    private childHandleMap?: HandleMap<ClassTreeNode>;
    private schemeNameMap: Map<string, ClassTreeNode | undefined>;
    private onSchemeData?: OnSchemeData;
    private schemeName: string = "";
    private captureEventsFromSpace = 0;
    private hasCode: boolean;
    private code?: ParsedCode;

    readonly protoName: string;

    readonly canReceiveEvents: boolean;

    readonly varnameToIdMap?: Map<string, number>;
    readonly varTypes?: VarData["type"][];

    readonly doubleIdToGlobal?: Uint16Array;
    readonly longIdToGlobal?: Uint16Array;
    readonly stringIdToGlobal?: Uint16Array;

    constructor({ proto, varIndexMap, onSchemeData }: ClassTreeNodeOptions) {
        this.proto = proto;
        this.protoName = proto.name;
        this.code = proto.code;
        if (onSchemeData) {
            this.onSchemeData = onSchemeData;
            this.parent = onSchemeData.parent;
            this.schemeName = onSchemeData.name;
        }

        if (varIndexMap) {
            const varCount = varIndexMap.length;
            this.varnameToIdMap = new Map(proto.variables!.map((v, idx) => [v.lowCaseName, idx]));
            this.varTypes = varIndexMap.map((v) => v.type);

            this.doubleIdToGlobal = new Uint16Array(varCount);
            this.longIdToGlobal = new Uint16Array(varCount);
            this.stringIdToGlobal = new Uint16Array(varCount);

            for (let varIdx = 0; varIdx < varCount; varIdx++) {
                const { globalIdx, type } = varIndexMap[varIdx];
                switch (type) {
                    case "FLOAT":
                        this.doubleIdToGlobal[varIdx] = globalIdx;
                        break;
                    case "HANDLE":
                    case "COLORREF":
                        this.longIdToGlobal[varIdx] = globalIdx;
                        break;
                    case "STRING":
                        this.stringIdToGlobal[varIdx] = globalIdx;
                }
            }
        }
        this.canReceiveEvents = !!(this.varnameToIdMap && this.varnameToIdMap.get("msg"));
        this.isDisabled = this.varnameToIdMap ? ClassTreeNode.createDisableGetter(this) : () => false;
        this.hasCode = !!proto.code;
        let root: ClassTreeNode = this;
        while (root.parent) root = root.parent;
        this.root = root;
        this.schemeNameMap = new Map([
            ["", this],
            ["..", this.parent],
            ["\\", this.root],
        ]);
    }

    setChilds(childs: HandleMap<ClassTreeNode>) {
        this.childHandleMap = childs;
        this.childs = [...this.childHandleMap.values()];
        this.schemeNameMap = new Map(this.childs.map((c) => [c.schemeName.toLowerCase(), c]));
        this.schemeNameMap.set("", this).set("..", this.parent).set("\\", this.root);
    }

    private setDefaultVarValue(type: VarData["type"], idx: number, value: string | number) {
        switch (type) {
            case "FLOAT":
                this.mmanager!.defaultDoubleValues[this.doubleIdToGlobal![idx]] = value as number;
                break;
            case "HANDLE":
            case "COLORREF":
                this.mmanager!.defaultLongValues[this.longIdToGlobal![idx]] = value as number;
                break;
            case "STRING":
                this.mmanager!.defaultStringValues[this.stringIdToGlobal![idx]] = value as string;
                break;
        }
    }

    /**
     * Инициализирует значения переменных по умолчанию.
     *
     * Необходимо применять к корню схемы.
     *
     * Замечание: Значения родительского класса превыше дочерних, поэтому они применяются последними.
     */
    // TODO: заменить 'new Error()' на 'Error()'
    initDefaultValuesRecursive(mmanager: MemoryManager) {
        if (this.mmanager) throw new Error("Значения уже инициализированы");
        this.mmanager = mmanager;
        if (this.childs) this.childs.forEach((c) => c.initDefaultValuesRecursive(mmanager));

        const values = this.proto.variables;
        if (!values) return;
        for (let i = 0; i < values.length; i++) {
            const curVar = values[i];
            let defValue: number | string | undefined;

            //Значение по умолчанию
            if (curVar.defaultValue !== undefined) {
                defValue = curVar.defaultValue;
            } else {
                //Если знач. по умолчанию нет, пытаемся получить специальное значение переменной.
                //prettier-ignore
                switch(`${curVar.type} ${curVar.lowCaseName}`) {
                    case "FLOAT orgx": defValue = this.onSchemeData && this.onSchemeData.position.x; break;
                    case "FLOAT orgy": defValue = this.onSchemeData && this.onSchemeData.position.y; break;
                    case "HANDLE _hobject": defValue = this.onSchemeData && this.onSchemeData.handle; break;
                    case "STRING _objname": defValue = this.onSchemeData && this.onSchemeData.name; break;
                    case "STRING _classname": defValue = this.protoName; break;
                }
            }

            if (defValue !== undefined) this.setDefaultVarValue(curVar.type, i, defValue);
        }
    }

    /**
     * Применяет к дереву классов набор переменных `varSet`, считанных из .stt файла.
     *
     * Необходимо применять к корню схемы после инициализации переменных.
     *
     * Замечание: Значения дочерних превыше родительских, поэтому они применяются последними.
     */
    applyVarSetRecursive(varSet: VarSetData) {
        if (!this.mmanager) throw new StratumError("Значения по умолчанию не инициализированы");
        if (this.protoName === varSet.classname && (!this.onSchemeData || this.onSchemeData.handle === varSet.handle)) {
            const { varData } = varSet;
            varData.forEach(({ name, value }) => {
                if (!this.varTypes) return;
                const varId = this.varnameToIdMap!.get(name.toLowerCase());
                if (varId === undefined) return;
                const varType = this.varTypes[varId];
                this.setDefaultVarValue(varType, varId, parseVarValue(varType, value));
            });
        }

        const myChilds = this.childHandleMap;
        if (myChilds)
            varSet.childSets.forEach((childSet) => {
                const child = myChilds.get(childSet.handle);
                if (child) child.applyVarSetRecursive(childSet);
            });
    }

    getClassByLowCasePath(path: string): ClassTreeNode | undefined {
        if (path === "") return this;
        const filter = path.split("\\");
        let root = path[0] === "\\" ? this.root : this;
        for (let i = 0; i < filter.length; i++) {
            const cl = root.schemeNameMap.get(filter[i]);
            if (!cl) return undefined;
            root = cl;
        }
        return root;
    }

    private _collectNodes(nodes: ClassTreeNode[]) {
        if (this.childs) this.childs.forEach((c) => c._collectNodes(nodes));
        nodes.push(this);
    }

    collectNodes() {
        const nodes = new Array<ClassTreeNode>();
        this._collectNodes(nodes);
        return nodes;
    }

    startCaptureEvents(spaceHandle: number): void {
        this.captureEventsFromSpace = spaceHandle;
    }

    stopCaptureEvents(): void {
        this.captureEventsFromSpace = 0;
    }

    isCapturingEvents(spaceHandle: number): boolean {
        return this.captureEventsFromSpace === spaceHandle;
    }

    computeSchemeRecursive(ctx: VmContext, force: boolean = false) {
        if (ctx.hasError || (!force && this.isDisabled())) return;

        const childs = this.childs;
        if (childs) for (let i = 0; i < childs.length; i++) childs[i].computeSchemeRecursive(ctx);

        if (this.hasCode === false) return;

        const prevClass = ctx.currentClass;
        const prevCmdIdx = ctx.pushClass(this);

        executeCode(ctx, this.code!);
        ctx.popClass(prevClass, prevCmdIdx);

        if (ctx.hasError) {
            const msg = `\nв классе ${this.onSchemeData ? "#" + this.onSchemeData.handle + " " : ""}${this.protoName}`;
            ctx.addErrorInfo(msg);
        }
    }
}
