import { StratumError } from "./errors";
import { ChildData, ClassData, LinkData, VarData } from "./types";

export interface Variable {
    readonly type: VarData["type"];
    newValue: number | string;
    oldValue: number | string;
    defaultValue?: number | string;
}

export type OnSchemeData<T extends ClassBase<T>> = ChildData["onSchemeData"] & { parent: ClassBase<T> };
export type ChildFactory<T extends ClassBase<T>> = (childName: string, onSchemeData: OnSchemeData<T>) => T;

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

function errMsg(handle1: any, handle2: any) {
    return `Невозможно провести связь ${handle1}-${handle2}`;
}

export abstract class ClassBase<T extends ClassBase<T>> {
    private variableInfo?: VariableNode[];
    private varNameIndexMap?: Map<string, number>;

    protected variables?: Variable[];
    protected childs?: Map<number, T>;

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
        { vars, childs, links }: ClassData,
        childFactory?: ChildFactory<T>,
        private onSchemeData?: OnSchemeData<T>
    ) {
        if (vars) this.setVars(vars);
        if (childs && childFactory) this.setChilds(childs, childFactory);
        if (links) this.setLinks(links);

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

    protected callRecursive(func: (theClass: T) => any) {
        this.childs && this.childs.forEach(c => c.callRecursive(func));
        func((this as ClassBase<T>) as T);
    }

    getVarId(varName: string): number | undefined {
        return this.varNameIndexMap && this.varNameIndexMap.get(varName.toLowerCase());
    }

    extractVariables() {
        const vars = new Set<Variable>();
        this.callRecursive(({ variables }) => variables && variables.forEach(v => vars.add(v)));
        return vars;
    }

    private setVars(vars: VarData[]) {
        const mp = (this.varNameIndexMap = new Map<string, number>());
        this.variableInfo = vars.map((v, varId) => {
            mp.set(v.name.toLowerCase(), varId);
            return new VariableNode(v.type, this.getVarValue(v));
        });
    }

    private setChilds(childs: ChildData[], childFactory: ChildFactory<T>) {
        const childData: [number, T][] = childs.map(({ className, onSchemeData: osd }) => [
            osd.handle,
            childFactory(className, { ...osd, parent: this })
        ]);
        this.childs = new Map<number, T>(childData);
    }

    private setLinks(links: LinkData[]) {
        for (const { handle1, handle2, vars } of links) {
            const first = handle1 ? this.childs && this.childs.get(handle1) : (this as ClassBase<T>);
            const second = handle2 ? this.childs && this.childs.get(handle2) : (this as ClassBase<T>);
            if (!first || !second || !first.variableInfo || !second.variableInfo)
                throw new StratumError(errMsg(handle1, handle2));
            for (const { name1, name2 } of vars) {
                const varId1 = first.getVarId(name1);
                const varId2 = second.getVarId(name2);
                if (varId1 == undefined || varId2 == undefined)
                    throw new StratumError(errMsg(handle1, handle2) + `: ${name1}-${name2}`);
                VariableNode.connect(first.variableInfo[varId1], second.variableInfo[varId2]);
            }
        }
    }
}
