import { StratumError } from "../errors";
import { insertImage, replaceIcon } from "../graphics/schemeComposer";
import { HandleMap, VectorDrawData } from "../graphics/types";
import { VectorDrawInstance } from "../graphics/vectorDrawInstance";
import { WindowSystem } from "../graphics/windowSystem";
import { ClassFunctions, GraphicSpaceResolver, ProjectFunctions, VmBool } from "../vm/types";
import { VirtualMachine } from "../vm/virtualMachine";
import { ChildFactory, ClassInstance, Variable } from "./classInstance";
import { createDefaultValue } from "./helpers";
import { ChildData, ClassData, VarSet } from "./types";

function copyMap<T>(map: HandleMap<T>) {
    const newMap = new Map<number, T>();
    map.forEach((v, k) => newMap.set(k, v));
    return newMap;
}

function makeImageCopy(image: VectorDrawData) {
    const imageCopy = { ...image };
    if (image.elements) imageCopy.elements = copyMap(image.elements);
    if (image.texts) imageCopy.texts = copyMap(image.texts);
    return imageCopy;
}

function recalcImageOrigin(image: VectorDrawData) {
    let x: number | undefined = undefined,
        y: number | undefined = undefined;
    if (!image.elements) return;
    for (const el of image.elements.values()) {
        if (el.type == "group") continue;
        if (x == undefined || el.position.x < x) x = el.position.x;
        if (y == undefined || el.position.y < y) y = el.position.y;
    }
    image.origin = { x: x || 0, y: y || 0 };
}

function composeScheme(scheme: VectorDrawData, childs: ChildData[], classes: Map<string, ClassData>) {
    for (const c of childs) {
        const childProto = classes.get(c.className)!;
        const { handle: groupHandle, position } = c.onSchemeData;
        if (childProto.image) {
            const image = childProto.image as VectorDrawData & { __originRecalculated?: boolean };
            if (!image.__originRecalculated) {
                recalcImageOrigin(image);
                image.__originRecalculated = true;
            }
            insertImage(scheme, makeImageCopy(childProto.image), groupHandle, position);
        } else {
            const { iconRef, iconIndex } = childProto;
            if (iconRef) replaceIcon(scheme, groupHandle, iconRef, iconIndex || 0);
        }
    }
}

export class Project implements ProjectFunctions {
    private tree: ClassInstance;
    private allVars: Set<Variable>;
    windows = new WindowSystem();
    private vm = new VirtualMachine(this.windows, <any>{}, this);
    constructor(rootName: string, private classCollection: Map<string, ClassData>, varSet?: VarSet) {
        const getClass = (protoName: string) => {
            const proto = classCollection.get(protoName);
            if (!proto) throw new StratumError(`Прототип класса ${protoName} не найден`);
            return proto;
        };

        const factory: ChildFactory = (pName, osd) => new ClassInstance(pName, getClass(pName), factory, osd);
        this.tree = new ClassInstance(rootName, getClass(rootName), factory);
        if (varSet) this.tree.applyVariables(varSet);
        const allVars = this.tree.extractVariables();
        allVars.forEach(v => {
            if (v.defaultValue == undefined) v.defaultValue = createDefaultValue(v.type);
            v.newValue = v.oldValue = v.defaultValue;
        });
        this.allVars = allVars;
    }

    createSchemeInstance(className: string): GraphicSpaceResolver | undefined {
        const proto = this.classCollection.get(className);
        if (!proto || !proto.scheme) return undefined;
        const scheme = proto.scheme as VectorDrawData & { __composed?: boolean };
        if (!scheme.__composed) {
            if (proto.childs) composeScheme(scheme, proto.childs, this.classCollection);
            scheme.__composed = true;
        }
        return canvas => new VectorDrawInstance(scheme, canvas);
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
        this.tree.computeScheme(this.vm);
        this.allVars.forEach(v => (v.oldValue = v.newValue));
    }
    stopComputing(): void {
        throw new Error("Method not implemented.");
    }
}
