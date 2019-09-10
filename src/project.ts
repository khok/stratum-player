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
import SchemeInstance from "./graphics/schemeInstance";
import { IClassInstance, IProject, ISchemeInstance, VirtualMachine } from "./vm";

type VarValue = { new: number | string; old: number | string; def: number | string };

function createNodeChilds(
    node: ClassInstance,
    collection: Map<string, StratumClassInfo>,
    { childs, links }: { childs?: readonly StratumChildInfo[]; links?: readonly StratumLinkInfo[] }
) {
    if (childs) {
        const nodeChilds = childs.map(({ className, onSchemeData: data }) => {
            const childProto = collection.get(className);
            if (!childProto) throw new StratumError(`Прототип класса ${className} не найден`);
            const child = new ClassInstance(className, childProto.convertedCode, childProto.vars, {
                parent: node,
                data
            });
            createNodeChilds(child, collection, childProto);
            return child;
        });
        node.setChilds(nodeChilds);
    }

    if (links) node.setLinks(links);
}

export class Project implements IProject {
    //private
    collection: Map<string, StratumClassInfo>;
    tree: ClassInstance;

    private allVars: VarValue[];
    private vm = new VirtualMachine(<any>{}, <any>{}, this);

    constructor(rootName: string, classCollection: Map<string, StratumClassInfo>, varSet?: StratumVarSet) {
        const proto = classCollection.get(rootName);
        if (!proto) throw new StratumError(`Прототип класса ${rootName} не найден`);

        const root = new ClassInstance(rootName, proto.convertedCode, proto.vars);
        createNodeChilds(root, classCollection, proto);

        const allVars = <VarValue[]>root.initVarsRecursive(varSet);
        allVars.forEach(v => (v.new = v.old = v.def));
        this.collection = classCollection;
        this.tree = root;
        this.allVars = allVars;
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

    private stopped = false;
    stop() {
        this.stopped = true;
    }

    compute() {
        if (this.stopped) return;
        this.tree.compute(this.vm, true);
        this.vm.reset();
        this.allVars.forEach(v => (v.old = v.new));
    }
}
