import { ChildFactory, Variable } from "./classBase";
import { ClassInstance } from "./classInstance";
import { StratumError } from "./errors";
import { createDefaultValue } from "./helpers";
import { ClassData, VarSet } from "./types";
import { ClassFunctions, ProjectFunctions, SchemeResolver, VmBool } from "./vm/types";
import { VirtualMachine } from "./vm/virtualMachine";

export class Project implements ProjectFunctions {
    private tree: ClassInstance;
    private vm: VirtualMachine;
    private allVars: Set<Variable>;
    constructor(rootName: string, classCollection: Map<string, ClassData>, varSet?: VarSet) {
        const getClass = (protoName: string) => {
            const proto = classCollection.get(protoName);
            if (!proto) throw new StratumError(`Прототип класса ${protoName} не найден`);
            return proto;
        };

        const factory: ChildFactory<ClassInstance> = (pName, osd) =>
            new ClassInstance(pName, getClass(pName), factory, osd);
        this.tree = new ClassInstance(rootName, getClass(rootName), factory);
        if (varSet) this.tree.applyVariables(varSet);
        const allVars = this.tree.extractVariables();
        allVars.forEach(v => {
            if (v.defaultValue == undefined) v.defaultValue = createDefaultValue(v.type);
            v.newValue = v.oldValue = v.defaultValue;
        });
        this.allVars = allVars;
        this.vm = new VirtualMachine(<any>{}, <any>{}, this);
    }

    createSchemeInstance(className: string): SchemeResolver | undefined {
        throw new Error("Method not implemented.");
    }
    hasClass(className: string): VmBool {
        throw new Error("Method not implemented.");
    }
    getClassesByProtoName(className: string): ClassFunctions[] {
        const classes: ClassFunctions[] = [];

        //ПЕРЕПИСАТЬ
        const search = (ci: ClassInstance) => {
            if (ci.protoName == className) classes.push(ci);
            if ((<any>ci).childs) (<any>ci).childs.forEach((c: ClassInstance) => search(c));
        };
        search(this.tree);
        return classes;
    }
    compute() {
        this.tree.compute(this.vm);
        this.allVars.forEach(v => (v.oldValue = v.newValue));
    }
    stopComputing(): void {
        throw new Error("Method not implemented.");
    }
}
