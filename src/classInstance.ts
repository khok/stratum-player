import { ChildData, ClassData, VarData } from "./types";
import { Bytecode, ClassFunctions, VmContext } from "./vm/types";

function getDefaultValue(type: VarData["type"]) {
    switch (type) {
        case "FLOAT":
            return 0;
        case "HANDLE":
            return 0;
        case "STRING":
            return "";
        case "COLORREF":
            return "rgb(0, 0, 0)";
    }
}

interface VarValue {
    new: number | string;
    old: number | string;
    def?: number | string;
}

export class ClassInstance implements ClassFunctions {
    private static specialVars = new Map<string, (ci: ClassInstance) => string | number | undefined>([
        ["FLOAT orgx", ({ onSchemeData: osd }) => osd && osd.position.x],
        ["FLOAT orgy", ({ onSchemeData: osd }) => osd && osd.position.y],
        ["HANDLE _hobject", ({ onSchemeData: osd }) => osd && osd.handle],
        ["STRING _objname", ({ onSchemeData: osd }) => osd && osd.name],
        ["STRING _classname", ({ protoName }) => protoName]
    ]);

    private code?: Bytecode;

    private varValues: VarValue[];
    private varNameIndexMap: Map<string, number>;

    // private childs: ClassInstance[] = [];
    // private childHandleMap = new Map<number, ClassInstance>();

    private isDisabled = () => false;

    constructor(
        public readonly protoName: string,
        { vars, bytecode }: ClassData,
        private onSchemeData?: ChildData["onSchemeData"] & { parent: ClassInstance }
    ) {
        this.code = bytecode;
        this.varNameIndexMap = new Map<string, number>();
        //prettier-ignore
        this.varValues = vars ? vars.map((v, i) => {
            this.varNameIndexMap.set(v.name.toLowerCase(), i);
            const value = v.defaultValue || getDefaultValue(v.type);
            return { new: value, old: value, def: v.defaultValue };
        }) : [];
    }

    // setChilds(childs: ClassInstance[]) {
    //     const hMap = this.childHandleMap = new Map<number, ClassInstance>();
    //     childs.forEach(c => {
    //         c.onSchemeData.
    //     })
    // }

    getVarIndex(varName: string): number {
        return this.varNameIndexMap.get(varName.toLowerCase())!;
    }
    setNewVarValue(id: number, value: string | number): void {
        this.varValues[id].new = value;
    }
    setOldVarValue(id: number, value: string | number): void {
        this.varValues[id].old = value;
    }
    getNewVarValue(id: number): string | number {
        return this.varValues[id].new;
    }
    getOldVarValue(id: number): string | number {
        return this.varValues[id].old;
    }
    getClassesByPath(path: string): ClassFunctions | ClassFunctions[] | undefined {
        throw new Error("Method not implemented.");
    }
    compute(ctx: VmContext, computeChilds: boolean): void {
        if (this.isDisabled()) return;
        // if (computeChilds && this.childs) for (const c of this.childs) c.compute(vm, true);
        if (this.code) ctx.compute(this.code, this);
    }
}
