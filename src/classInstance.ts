import { ChildFactory, ClassBase, OnSchemeData } from "./classBase";
import { parseVarValue } from "./helpers";
import { ClassData, VarSet } from "./types";
import { Bytecode, ClassFunctions, VmContext } from "./vm/types";

export class ClassInstance extends ClassBase<ClassInstance> implements ClassFunctions {
    private code?: Bytecode;
    private isDisabled = () => false;

    constructor(
        public readonly protoName: string,
        classData: ClassData,
        childFactory?: ChildFactory<ClassInstance>,
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

    applyVariables(varSet: VarSet) {
        if (this.protoName == varSet.classname) {
            const { varData } = varSet;
            varData.forEach(({ name, data }) => {
                if (!this.variables) return;
                const varId = this.getVarId(name);
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
        this.callRecursive(c => c.code && ctx.compute(c.code, c));
    }
}
