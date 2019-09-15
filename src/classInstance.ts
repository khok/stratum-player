import { ChildFactory, ClassBase, OnSchemeData } from "./classBase";
import { ClassData } from "./types";
import { Bytecode, ClassFunctions, VmContext } from "./vm/types";

// function createDefaultValue(type: VarData["type"]) {
//     switch (type) {
//         case "FLOAT":
//             return 0;
//         case "HANDLE":
//             return 0;
//         case "STRING":
//             return "";
//         case "COLORREF":
//             return "rgb(0, 0, 0)";
//     }
// }

export class ClassInstance extends ClassBase<ClassInstance> implements ClassFunctions {
    private code?: Bytecode;
    private isDisabled = () => false;

    constructor(
        public readonly protoName: string,
        classData: ClassData,
        childFactory: ChildFactory<ClassInstance>,
        onSchemeData?: OnSchemeData<ClassInstance>
    ) {
        super(protoName, classData, childFactory, onSchemeData);
        this.code = classData.bytecode;

        const enableVarid = this.getVarId("_enable");
        const disableVarId = this.getVarId("_disable");

        if (enableVarid != undefined) this.isDisabled = () => this.getNewVarValue(enableVarid) < 1;

        if (disableVarId != undefined) {
            const disableVarPriority = enableVarid == undefined || disableVarId < enableVarid;
            if (disableVarPriority) this.isDisabled = () => this.getNewVarValue(disableVarId) > 0;
        }
    }

    getVarId(varName: string): number | undefined {
        return this.varNameIndexMap && this.varNameIndexMap.get(varName.toLowerCase());
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
    getClassesByPath(path: string): ClassFunctions | ClassFunctions[] | undefined {
        throw new Error("Method not implemented.");
    }
    compute(ctx: VmContext, respectDisableVar = true): void {
        if (respectDisableVar && this.isDisabled()) return;
        if (this.childs) this.childs.forEach(c => c.compute(ctx, true));
        if (this.code) ctx.compute(this.code, this);
    }
}
