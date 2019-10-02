import { StratumError } from "../errors";
import { ChildData, ClassData, LinkData, VarData, VarSet } from "./types";
import { ClassFunctions, Bytecode, VmContext } from "../vm/types";
import { parseVarValue } from "./helpers";

export interface Variable {
    readonly type: VarData["type"];
    newValue: number | string;
    oldValue: number | string;
    defaultValue?: number | string;
}

export type OnSchemeData = ChildData["onSchemeData"] & { parent: ClassInstance };
export type ChildFactory = (childName: string, onSchemeData: OnSchemeData) => ClassInstance;

class VariableNode {
    private propagated = false;
    private connectedNodes = new Set<VariableNode>();
    private value: Variable;
    constructor(type: VarData["type"], private data?: string | number) {
        this.value = { type } as Variable;
    }

    static connect(first: VariableNode, second: VariableNode) {
        if (first.propagated) throw Error("first propagated");
        if (second.propagated) throw Error("second propagated");
        first.connectedNodes.add(second);
        second.connectedNodes.add(first);
    }
    propagateValue() {
        this.propagate(this.value);
    }
    private propagate(value: Variable) {
        if (this.propagated) return;
        this.propagated = true;
        this.value = value;
        this.connectedNodes.forEach(n => n.propagate(value));
    }
    /**
     * Следует вызывать в порядке вычислений
     */
    extractAsVariable(): Variable {
        if (!this.propagated) throw Error("propagate first");
        if (this.data != undefined) this.value.defaultValue = this.data;
        return this.value;
    }
}

function formatErr(handle1: any, handle2: any) {
    return `Невозможно провести связь ${handle1}-${handle2}`;
}

function createDisableGetter(ci: ClassInstance): () => boolean {
    const enableVarid = ci.getVarId("_enable");
    const disableVarId = ci.getVarId("_disable");

    let res = () => false;

    if (enableVarid != undefined) res = () => ci.getNewVarValue(enableVarid) < 1;

    if (disableVarId != undefined) {
        const disableVarPriority = enableVarid == undefined || disableVarId < enableVarid;
        if (disableVarPriority) res = () => ci.getNewVarValue(disableVarId) > 0;
    }
    return res;
}

export class ClassInstance implements ClassFunctions {
    private variableInfo?: VariableNode[];
    private varNameIndexMap?: string[];

    protected variables?: Variable[];
    protected childs?: Map<number, ClassInstance>;

    private code?: Bytecode;
    private isDisabled: () => boolean;

    //Значение по умолчанию > спец. значение > пустое значение
    private getVarValue({ name, type, defaultValue }: VarData): string | number | undefined {
        if (defaultValue != undefined) return defaultValue;

        const { onSchemeData: osd, protoName } = this;

        //prettier-ignore
        switch(`${type} ${name.toLowerCase()}`) {
            case "FLOAT orgx": return osd && osd.position.x;
            case "FLOAT orgy": return osd && osd.position.y;
            case "HANDLE _hobject": return osd && osd.handle;
            case "STRING _objname": return osd && osd.name;
            case "STRING _classname": return protoName;
        }
        return undefined;
    }

    constructor(
        public readonly protoName: string,
        { vars, childs, links, bytecode }: ClassData,
        childFactory?: ChildFactory,
        private onSchemeData?: OnSchemeData
    ) {
        if (vars) this.createVars(vars);
        this.isDisabled = createDisableGetter(this);
        if (childs && childFactory) this.createChilds(childs, childFactory);
        if (links) this.linkVars(links);
        this.code = bytecode;

        const isRoot = !onSchemeData;
        if (isRoot) {
            this.callRecursive(({ variableInfo }) => variableInfo && variableInfo.forEach(c => c.propagateValue()));

            this.callRecursive(ci => {
                const vInfo = ci.variableInfo;
                delete ci.variableInfo;
                ci.variables = vInfo && vInfo.map(v => v.extractAsVariable());
            });
        }
    }

    setNewVarValue(id: number, value: string | number): void {
        this.variables![id].newValue = value;
    }
    setOldVarValue(id: number, value: string | number): void {
        this.variables![id].oldValue = value;
    }
    getNewVarValue(id: number): string | number {
        return this.variables![id].newValue;
    }
    getOldVarValue(id: number): string | number {
        return this.variables![id].oldValue;
    }
    computeScheme(ctx: VmContext, respectDisableVar = true): void {
        if (respectDisableVar && this.isDisabled()) return;
        if (this.code) ctx.executeCode(this.code, this);
        if (this.childs) for (const child of this.childs.values()) child.computeScheme(ctx);
    }

    private callRecursive(func: (theClass: ClassInstance) => any) {
        this.childs && this.childs.forEach(c => c.callRecursive(func));
        func((this as ClassInstance) as ClassInstance);
    }

    /**
     * Возращает id переменной или undefined.
     * *Не забывайте предварительно лоуэркейзить аргумент.*
     */
    getVarId(varName: string): number | undefined {
        const vars = this.varNameIndexMap;
        if (!vars) return undefined;
        for (let i = 0; i < vars.length; i++) {
            if (vars[i] == varName) return i;
        }
        return undefined;
    }

    getClassesByPath(path: string): ClassFunctions | ClassFunctions[] | undefined {
        console.log(`getClassesByPath(${path})`);
        if (path === "") return this;
        if (path === "..") return this.onSchemeData && this.onSchemeData.parent;
        if (path === "\\") return this.onSchemeData ? this.onSchemeData.parent.getClassesByPath("\\") : this;

        throw Error(`getClassesByPath() для пути ${path} не реализован`);
    }

    applyVariables(varSet: VarSet) {
        if (this.protoName == varSet.classname) {
            const { varData } = varSet;
            varData.forEach(({ name, data }) => {
                if (!this.variables) return;
                const varId = this.getVarId(name.toLowerCase());
                const variable = varId != undefined && this.variables[varId];
                if (!variable) return;
                variable.defaultValue = parseVarValue(variable.type, data);
            });
        }

        const myChilds = this.childs;
        if (myChilds)
            varSet.childSets.forEach(set => {
                const child = myChilds.get(set.handle);
                if (child) child.applyVariables(set);
            });
    }

    extractVariables() {
        const vars = new Set<Variable>();
        this.callRecursive(({ variables }) => variables && variables.forEach(v => vars.add(v)));
        return vars;
    }

    private createVars(vars: VarData[]) {
        const mp = (this.varNameIndexMap = new Array<string>());
        this.variableInfo = vars.map((v, varId) => {
            mp.push(v.name.toLowerCase());
            return new VariableNode(v.type, this.getVarValue(v));
        });
    }

    private createChilds(childs: ChildData[], childFactory: ChildFactory) {
        const childData: [number, ClassInstance][] = childs.map(({ className, onSchemeData: osd }) => [
            osd.handle,
            childFactory(className, { ...osd, parent: this })
        ]);
        this.childs = new Map<number, ClassInstance>(childData);
    }

    private linkVars(links: LinkData[]) {
        for (const { handle1, handle2, vars } of links) {
            const first = handle1 ? this.childs && this.childs.get(handle1) : (this as ClassInstance);
            const second = handle2 ? this.childs && this.childs.get(handle2) : (this as ClassInstance);
            if (!first || !second || !first.variableInfo || !second.variableInfo)
                throw new StratumError(formatErr(handle1, handle2));
            for (const { name1, name2 } of vars) {
                const varId1 = first.getVarId(name1.toLowerCase());
                const varId2 = second.getVarId(name2.toLowerCase());
                if (varId1 == undefined || varId2 == undefined)
                    throw new StratumError(formatErr(handle1, handle2) + `: ${name1}-${name2}`);
                VariableNode.connect(first.variableInfo[varId1], second.variableInfo[varId2]);
            }
        }
    }
}
