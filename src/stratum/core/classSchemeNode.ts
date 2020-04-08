import { VarSetData, VarData } from "data-types-base";
import { Point2D } from "data-types-graphics";
import { ClassState } from "vm-interfaces-base";
import { HandleMap } from "~/helpers/handleMap";
import { parseVarValue } from "~/helpers/varValueFunctions";
import { executeCode } from "~/vm/executeCode";
import { VmContext } from "~/vm/vmContext";
import { ClassPrototype } from "./classPrototype";
import { StratumError } from "~/helpers/errors";
import { MemoryManager } from "./memoryManager";

export interface SchemeData {
    parent: ClassSchemeNode;
    handle: number;
    position: Point2D;
    name: string;
}

export interface ClassSchemeNodeOptions {
    proto: ClassPrototype;
    varIndexMap?: { globalIdx: number; type: VarData["type"] }[];
    schemeData?: SchemeData;
}

export class ClassSchemeNode implements ClassState {
    private static createDisableGetter(ci: ClassSchemeNode): () => boolean {
        const enableVarid = ci.varIdToLowcaseNameMap!.get("_enable");
        const disableVarId = ci.varIdToLowcaseNameMap!.get("_disable");

        let res = () => false;

        if (enableVarid !== undefined)
            res = () => ci.mmanager!.newDoubleValues[ci.doubleVarMappingArray![enableVarid]] < 1;

        if (disableVarId !== undefined) {
            const disableVarPriority = enableVarid === undefined || disableVarId < enableVarid;
            if (disableVarPriority)
                res = () => ci.mmanager!.newDoubleValues[ci.doubleVarMappingArray![disableVarId]] > 0;
        }
        return res;
    }

    private readonly proto: ClassPrototype;
    private mmanager?: MemoryManager;
    private isDisabled: () => boolean;
    private childs?: HandleMap<ClassSchemeNode>;
    private schemeData?: SchemeData;
    private captureEventsFromHandle = 0;
    private hasCode: boolean;

    readonly canReceiveEvents: boolean;

    readonly varIdToLowcaseNameMap?: Map<string, number>;
    readonly varTypes?: VarData["type"][];

    readonly doubleVarMappingArray?: Uint16Array;
    readonly longVarMappingArray?: Uint16Array;
    readonly stringVarMappingArray?: Uint16Array;

    constructor({ proto, varIndexMap, schemeData }: ClassSchemeNodeOptions) {
        this.proto = proto;
        this.schemeData = schemeData;

        if (varIndexMap) {
            const varCount = varIndexMap.length;
            this.varIdToLowcaseNameMap = new Map(proto.variables!.map((v, idx) => [v.lowCaseName, idx]));
            this.varTypes = varIndexMap.map((v) => v.type);

            this.doubleVarMappingArray = new Uint16Array(varCount);
            this.longVarMappingArray = new Uint16Array(varCount);
            this.stringVarMappingArray = new Uint16Array(varCount);

            for (let varIdx = 0; varIdx < varCount; varIdx++) {
                const { globalIdx, type } = varIndexMap[varIdx];
                switch (type) {
                    case "FLOAT":
                        this.doubleVarMappingArray[varIdx] = globalIdx;
                        break;
                    case "HANDLE":
                    case "COLORREF":
                        this.longVarMappingArray[varIdx] = globalIdx;
                        break;
                    case "STRING":
                        this.stringVarMappingArray[varIdx] = globalIdx;
                }
            }
        }
        this.canReceiveEvents = !!(this.varIdToLowcaseNameMap && this.varIdToLowcaseNameMap.get("msg"));
        this.isDisabled = this.varIdToLowcaseNameMap ? ClassSchemeNode.createDisableGetter(this) : () => false;
        this.hasCode = !!proto.code;
    }

    setChilds(childs: HandleMap<ClassSchemeNode>) {
        this.childs = childs;
    }

    get protoName() {
        return this.proto.name;
    }

    private setDefaultVarValue(type: VarData["type"], idx: number, value: string | number) {
        switch (type) {
            case "FLOAT":
                this.mmanager!.defaultDoubleValues[this.doubleVarMappingArray![idx]] = value as number;
                break;
            case "HANDLE":
            case "COLORREF":
                this.mmanager!.defaultLongValues[this.longVarMappingArray![idx]] = value as number;
                break;
            case "STRING":
                this.mmanager!.defaultStringValues[this.stringVarMappingArray![idx]] = value as string;
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
                    case "FLOAT orgx": defValue = this.schemeData && this.schemeData.position.x; break;
                    case "FLOAT orgy": defValue = this.schemeData && this.schemeData.position.y; break;
                    case "HANDLE _hobject": defValue = this.schemeData && this.schemeData.handle; break;
                    case "STRING _objname": defValue = this.schemeData && this.schemeData.name; break;
                    case "STRING _classname": defValue = this.protoName; break;
                }
            }

            if (defValue !== undefined) this.setDefaultVarValue(curVar.type, i, defValue);
            // } else {
            //     //строковые значения инициализируем особым образом.
            //     const globaVarIdx = this.stringVarMappingArray![i];
            //     //prettier-ignore
            //     if((curVar.type === "STRING" || curVar.type === "COLORREF") && !mmanager.defaultStringValues[globaVarIdx])
            //         mmanager.defaultStringValues[globaVarIdx] = curVar.type === "STRING" ? "" : "rgb(0, 0, 0)";
            // }

            //Если нет значения по умолчанию

            ////Если нет специального значения, и переменная еще не была установлена предыдущими имиджами,
            ////нужно проинициализировать ее самому.
            // if (resultValue === undefined) {
            //     if (!mmanager.isValueInitialized(this.toGlobalVarId![i]))
            //         this.setDefaultVarValue(i, createDefaultValue(values[i].type));
            // }

            //Если переменная имеет спец. значение или у нее есть значение по умолчанию, устанавливаем его,
            //перекрывая значения установленные имиджами, выполняющимися ранее.
            // this.setDefaultVarValue(i, resultValue);
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
        if (this.protoName === varSet.classname && (!this.schemeData || this.schemeData.handle === varSet.handle)) {
            const { varData } = varSet;
            varData.forEach(({ name, value }) => {
                if (!this.varTypes) return;
                const varId = this.varIdToLowcaseNameMap!.get(name.toLowerCase());
                if (varId === undefined) return;
                const varType = this.varTypes[varId];
                this.setDefaultVarValue(varType, varId, parseVarValue(varType, value));
            });
        }

        const myChilds = this.childs;
        if (myChilds)
            varSet.childSets.forEach((childSet) => {
                const child = myChilds.get(childSet.handle);
                if (child) child.applyVarSetRecursive(childSet);
            });
    }

    // getVarIdLowCase(varName: string): number | undefined {
    //     return this.proto.getVarIdLowCase(varName);
    // }
    // setDefaultVarValue(id: number, value: string | number): void {
    //     this.mmanager!.setDefaultVarValue(this.toGlobalVarId![id], value);
    // }
    // getDefaultVarValue(id: number): string | number {
    //     return this.mmanager!.getDefaultVarValue(this.toGlobalVarId![id]);
    // }
    // setNewVarValue(id: number, value: string | number): void {
    //     this.mmanager!.setNewVarValue(this.toGlobalVarId![id], value);
    // }
    // getNewVarValue(id: number): string | number {
    //     return this.mmanager!.getNewVarValue(this.toGlobalVarId![id]);
    // }
    // setOldVarValue(id: number, value: string | number): void {
    //     this.mmanager!.setOldVarValue(this.toGlobalVarId![id], value);
    // }
    // getOldVarValue(id: number): string | number {
    //     return this.mmanager!.getOldVarValue(this.toGlobalVarId![id]);
    // }
    // setVarValueByLowCaseName(name: string, value: string | number): void {
    //     const id = this.getVarIdLowCase(name);
    //     if (id !== undefined) {
    //         this.setOldVarValue(id, value);
    //         this.setNewVarValue(id, value);
    //     }
    // }
    get parent() {
        return this.schemeData && this.schemeData.parent;
    }
    getClassByPath(path: string): ClassState | undefined {
        //вернуть этот класс
        if (path === "") return this;
        //вернуть родительский
        if (path === "..") return this.parent;
        //вернуть корень иерархии
        if (path === "\\") return this.parent ? this.parent.getClassByPath("\\") : this;

        throw Error(`getClassesByPath() для пути ${path} не реализован`);
    }

    private _collectNodes(nodes: ClassSchemeNode[]) {
        if (this.childs) this.childs.forEach((c) => c._collectNodes(nodes));
        nodes.push(this);
    }

    collectNodes() {
        const nodes = new Array<ClassSchemeNode>();
        this._collectNodes(nodes);
        return nodes;
    }

    startCaptureEvents(spaceHandle: number): void {
        this.captureEventsFromHandle = spaceHandle;
    }

    stopCaptureEvents(): void {
        this.captureEventsFromHandle = 0;
    }

    isCapturingEvents(spaceHandle: number): boolean {
        return this.captureEventsFromHandle === spaceHandle;
    }

    computeSchemeRecursive(ctx: VmContext, force: boolean = false) {
        if (ctx.hasError || (!force && this.isDisabled())) return;

        if (this.childs) for (const child of this.childs.values()) child.computeSchemeRecursive(ctx);
        if (this.hasCode === false) return;

        const prevClass = ctx.currentClass;
        const prevCmdIdx = ctx.substituteState(this);
        executeCode(ctx, this.proto.code!);
        if (ctx.hasError)
            ctx.addErrorInfo(`в классе ${this.schemeData ? "#" + this.schemeData.handle + " " : ""}${this.protoName}`);
        else ctx.returnState(prevClass, prevCmdIdx);
    }
}
