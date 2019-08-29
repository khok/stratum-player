import ClassInstance from "./classInstance";
import {
    MutableStratumScheme,
    StratumChildInfo,
    StratumClassInfo,
    StratumLinkInfo,
    StratumVarSet
} from "./deserializers";
import { StratumError } from "./errors";
import insertImageOnScheme from "./insertImageOnScheme";
import SchemeInstance from "./schemeInstance";
import { IClassInstance, IProject, ISchemeInstance, VirtualMachine } from "./vm";

type VarValue = { new: number | string; old: number | string; def: number | string };

function createNodeChilds(
    parent: ClassInstance,
    collection: Map<string, StratumClassInfo>,
    proto: { childs?: readonly StratumChildInfo[]; links?: readonly StratumLinkInfo[] }
) {
    const { childs, links } = proto;

    if (childs) {
        const nodeChilds = childs.map(({ className, onSchemeData: data }) => {
            const childProto = collection.get(className);
            if (!childProto) throw new StratumError(`Прототип класса ${className} не найден`);
            const child = new ClassInstance(className, childProto.convertedCode, childProto.vars, { parent, data });
            createNodeChilds(child, collection, childProto);
            return child;
        });
        parent.setChilds(nodeChilds);
    }

    if (links) parent.setLinks(links);
}

export class Project implements IProject {
    private constructor(
        public collection: Map<string, StratumClassInfo>,
        public tree: ClassInstance,
        private allVars: VarValue[]
    ) {}
    private vm = new VirtualMachine(<any>{}, <any>{}, this);
    static fromClassCollection(
        rootName: string,
        classCollection: Map<string, StratumClassInfo>,
        varSet?: StratumVarSet
    ): Project {
        const proto = classCollection.get(rootName);
        if (!proto) throw new StratumError(`Прототип класса ${rootName} не найден`);
        const root = new ClassInstance(rootName, proto.convertedCode, proto.vars);
        createNodeChilds(root, classCollection, proto);
        const allVars = <VarValue[]>root.setDefaultValues(varSet);
        allVars.forEach(v => (v.new = v.old = v.def));
        return new Project(classCollection, root, allVars);
    }

    createSchemeInstance(className: string): ((canvas: HTMLCanvasElement) => ISchemeInstance) | undefined {
        const proto = this.collection.get(className);
        if (!proto || !proto.scheme) return undefined;

        const { scheme, childs } = proto;
        const result = (canvas: HTMLCanvasElement) => new SchemeInstance(scheme, canvas);

        if (scheme.composed) return result;

        if (childs) {
            for (const { className, onSchemeData } of childs) {
                const childProto = this.collection.get(className);
                if (!childProto) throw new StratumError(`Прототип класса ${className} не найден`);
                if (childProto.image) insertImageOnScheme(scheme, childProto.image, onSchemeData.handle);
            }
        }
        (<MutableStratumScheme>scheme).composed = true;
        return result;
    }

    hasClass(className: string) {
        return this.collection.has(className);
    }

    getClassesByProtoName(className: string) {
        const classes: IClassInstance[] = [];

        //ПЕРЕПИСАТЬ
        const search = (ci: ClassInstance) => {
            if (ci.protoName == className) classes.push(ci);
            if ((<any>ci).childs) (<any>ci).childs.forEach((c: ClassInstance) => search(c));
        };
        search(this.tree);
        return classes;
    }

    compute() {
        this.tree.compute(this.vm, true);
        this.vm.reset();
        this.allVars.forEach(v => (v.old = v.new));
    }
}
