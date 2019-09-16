import { ChildFactory } from "./classBase";
import { ClassInstance } from "./classInstance";
import { StratumError } from "./errors";
import { ClassData, VarSet } from "./types";
import { ClassFunctions, ProjectFunctions, SchemeResolver, VmBool } from "./vm/types";

export class Project implements ProjectFunctions {
    private tree: ClassInstance;
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

        // createNodeChilds(root, classCollection, rootProto);

        // const allVars = <VarValue[]>root.initVarsRecursive(varSet);
        // allVars.forEach(v => (v.new = v.old = v.def));
        // this.collection = classCollection;
        // this.tree = root;
        // this.allVars = allVars;
    }

    createSchemeInstance(className: string): SchemeResolver | undefined {
        throw new Error("Method not implemented.");
    }
    hasClass(className: string): VmBool {
        throw new Error("Method not implemented.");
    }
    getClassesByProtoName(className: string): ClassFunctions[] {
        throw new Error("Method not implemented.");
    }
    stopComputing(): void {
        throw new Error("Method not implemented.");
    }
}
