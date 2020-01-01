import { VarSetData } from "data-types-base";
import { Point2D } from "data-types-graphics";
import { ClassState } from "vm-interfaces-base";
import { createDisableGetter } from "~/helpers/createDisableGetter";
import { HandleMap } from "~/helpers/handleMap";
import { createDefaultValue, parseVarValue } from "~/helpers/varValueFunctions";
import { executeCode } from "~/vm/virtualMachine";
import { VmContext } from "~/vm/vmContext";
import { ClassPrototype } from "./classPrototype";
import { MemoryManager } from "./memoryManager";
import { StratumError } from "~/helpers/errors";

export interface SchemeData {
    parent: ClassSchemeNode;
    handle: number;
    position: Point2D;
    name: string;
}

export class ClassSchemeNode implements ClassState {
    private readonly proto: ClassPrototype;
    private mmanager?: MemoryManager;
    private isDisabled: () => boolean;
    private childs?: HandleMap<ClassSchemeNode>;
    private toGlobalVarId?: number[];
    private schemeData?: SchemeData;
    constructor(data: { proto: ClassPrototype; globalIndexMap?: number[]; schemeData?: SchemeData }) {
        this.proto = data.proto;
        this.schemeData = data.schemeData;
        this.isDisabled = data.proto.variables ? createDisableGetter(this) : () => false;
        this.toGlobalVarId = data.globalIndexMap;
    }

    setChilds(childs: HandleMap<ClassSchemeNode>) {
        this.childs = childs;
    }

    get protoName() {
        return this.proto.name;
    }

    /**
     * Инициализирует значения переменных по умолчанию.
     *
     * Необходимо применять к корню схемы.
     *
     * Замечание: Значения родительских превыше дочерних, поэтому они применяются последними.
     */
    initDefaultValuesRecursive(mmanager: MemoryManager) {
        if (this.mmanager) throw new Error("Значения уже инициализированы");
        this.mmanager = mmanager;
        if (this.childs) this.childs.forEach(c => c.initDefaultValuesRecursive(mmanager));
        const values = this.proto.variables;
        if (!values) return;
        for (let i = 0; i < values.length; i++) {
            const curVar = values[i];
            let resultValue: number | string | undefined;
            //Пытаемся получить специальное значение переменной.
            //prettier-ignore
            switch(`${curVar.type} ${curVar.lowCaseName}`) {
                case "FLOAT orgx": resultValue = this.schemeData && this.schemeData.position.x; break;
                case "FLOAT orgy": resultValue = this.schemeData && this.schemeData.position.y; break;
                case "HANDLE _hobject": resultValue = this.schemeData && this.schemeData.handle; break;
                case "STRING _objname": resultValue = this.schemeData && this.schemeData.name; break;
                case "STRING _classname": resultValue = this.protoName; break;
            }
            //Значение по умолчанию (если есть) перекрывает спец. значения.
            if (curVar.defaultValue !== undefined) resultValue = curVar.defaultValue;

            //В итоге, если переменная имеет спец. значение или у нее есть значение по умолчанию, устанавливаем его,
            //перекрывая значения установленные имиджами, выполняющимися ранее.
            if (resultValue !== undefined) {
                this.setDefaultVarValue(i, resultValue);
                continue;
            }
            //Если нет специального значения, и переменная еще не была установлена предыдущими имиджами,
            //нужно проинициализировать ее самому.
            if (!mmanager.isValueInitialized(this.toGlobalVarId![i]))
                this.setDefaultVarValue(i, createDefaultValue(values[i].type));
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
                if (!this.proto.variables) return;
                const varId = this.getVarIdLowCase(name.toLowerCase());
                if (!varId) return;
                const variable = this.proto.variables[varId];
                if (!variable) return;
                this.setDefaultVarValue(varId, parseVarValue(variable.type, value));
            });
        }

        const myChilds = this.childs;
        if (myChilds)
            varSet.childSets.forEach(childSet => {
                const child = myChilds.get(childSet.handle);
                if (child) child.applyVarSetRecursive(childSet);
            });
    }

    getVarIdLowCase(varName: string): number | undefined {
        return this.proto.getVarIdLowCase(varName);
    }
    setDefaultVarValue(id: number, value: string | number): void {
        this.mmanager!.setDefaultVarValue(this.toGlobalVarId![id], value);
    }
    getDefaultVarValue(id: number): string | number {
        return this.mmanager!.getDefaultVarValue(this.toGlobalVarId![id]);
    }
    setNewVarValue(id: number, value: string | number): void {
        this.mmanager!.setNewVarValue(this.toGlobalVarId![id], value);
    }
    getNewVarValue(id: number): string | number {
        return this.mmanager!.getNewVarValue(this.toGlobalVarId![id]);
    }
    setOldVarValue(id: number, value: string | number): void {
        this.mmanager!.setOldVarValue(this.toGlobalVarId![id], value);
    }
    getOldVarValue(id: number): string | number {
        return this.mmanager!.getOldVarValue(this.toGlobalVarId![id]);
    }
    get parent() {
        return this.schemeData && this.schemeData.parent;
    }
    getClassByPath(path: string): ClassState | undefined {
        console.log(`getClassesByPath(${path})`);
        //вернуть этот класс
        if (path === "") return this;
        //вернуть родительский
        if (path === "..") return this.parent;
        //вернуть корень иерархии
        if (path === "\\") return this.parent ? this.parent.getClassByPath("\\") : this;

        throw Error(`getClassesByPath() для пути ${path} не реализован`);
    }

    private _collectNodes(nodes: ClassSchemeNode[]) {
        if (this.childs) this.childs.forEach(c => c._collectNodes(nodes));
        nodes.push(this);
    }

    collectNodes() {
        const nodes = new Array<ClassSchemeNode>();
        this._collectNodes(nodes);
        return nodes;
    }

    computeSchemeRecursive(ctx: VmContext, respectDisableVar: boolean = true): boolean {
        if (ctx.error) return false;
        if (respectDisableVar && this.isDisabled()) return true;

        if (this.childs) for (const child of this.childs.values()) child.computeSchemeRecursive(ctx);

        const { code } = this.proto;
        if (!code) return true;
        const prevClass = ctx.currentClass;
        const prevCmdIdx = ctx.substituteState(this);
        executeCode(ctx, code);
        if (ctx.error) {
            ctx.addErrorInfo(`в классе ${this.schemeData ? "#" + this.schemeData.handle + " " : ""}${this.protoName}`);
            return false;
        }
        ctx.returnState(prevClass, prevCmdIdx);
        return true;
    }
}
