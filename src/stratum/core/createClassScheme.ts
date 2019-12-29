import { ClassData, VarData, LinkData } from "data-types-base";
import { ClassSchemeNode, SchemeData } from "./classSchemeNode";
import { StratumError } from "~/helpers/errors";
import { ClassPrototype } from "./classPrototype";
import { HandleMap } from "~/helpers/handleMap";
import { MemoryManager } from "./memoryManager";
import { Point2D } from "data-types-graphics";

function dataToProtos(classes: Map<string, ClassData>) {
    const protos = new Map<string, { data: ClassData; proto: ClassPrototype }>();
    classes.forEach((data, name) =>
        protos.set(name, {
            data,
            proto: new ClassPrototype(name, { vars: data.vars, code: data.bytecode && data.bytecode.parsed })
        })
    );
    return protos;
}

class VariableGraphNode {
    private propagated = false;
    private globalVarIdx = 0;
    private connectedNodes = new Set<VariableGraphNode>();

    constructor(readonly lowCaseName: string, readonly type: VarData["type"], private requestIndex: () => number) {}

    static connect(first: VariableGraphNode, second: VariableGraphNode) {
        if (first.propagated) throw Error("first propagated");
        if (second.propagated) throw Error("second propagated");
        first.connectedNodes.add(second);
        second.connectedNodes.add(first);
    }
    private propagateRecursive(index: number) {
        if (this.propagated) return;
        this.propagated = true;
        this.globalVarIdx = index;
        this.connectedNodes.forEach(n => n.propagateRecursive(index));
    }

    extractIndex(): number {
        if (!this.propagated) {
            const index = this.requestIndex();
            this.propagateRecursive(index);
        }
        return this.globalVarIdx;
    }
}

/**
 * Соединяет переменные нескольких объектов.
 * @param links данные о связях между переменными объектов
 * @param parent объект с дескриптором #0
 * @param childs карта объектов с дескрипторами от #1 и далее
 */
function linkVars(links: LinkData[], parent: VarStore, childs?: HandleMap<VarStore>) {
    for (const { handle1, handle2, connectedVars } of links) {
        //Получаем соединяемые объекты
        const first = handle1 ? childs && childs.get(handle1) : parent;
        const second = handle2 ? childs && childs.get(handle2) : parent;

        if (!first) throw new StratumError(`Объект ${handle1} не найден`);
        if (!first.vars) throw new StratumError(`Объект ${handle1} не имеет переменных`);
        if (!second) throw new StratumError(`Объект ${handle2} не найден`);
        if (!second.vars) throw new StratumError(`Объект ${handle2} не имеет переменных`);

        for (const { name1, name2 } of connectedVars) {
            //Получаем соединяемые переменные.
            const var1 = first.vars.find(v => v.lowCaseName === name1.toLowerCase());
            const var2 = second.vars.find(v => v.lowCaseName === name2.toLowerCase());

            if (var1 === undefined) throw new StratumError(`Переменная ${name1} не найдена в #${handle1}`);
            if (var2 === undefined) throw new StratumError(`Переменная ${name2} не найдена в #${handle2}`);
            if (var1.type !== var2.type)
                throw new StratumError(`Типы переменных ${name1} в #${handle1} и ${name2} в #${handle2} не совпадают`);

            VariableGraphNode.connect(var1, var2);
        }
    }
}

class VarStore {
    private proto: ClassPrototype;
    readonly vars?: VariableGraphNode[];
    private childs?: HandleMap<VarStore>;
    constructor(
        name: string,
        classes: Map<string, { data: ClassData; proto: ClassPrototype }>,
        reqIndex: () => number,
        private schemeData?: Omit<SchemeData, "parent">
    ) {
        const klass = classes.get(name);
        if (!klass) throw new StratumError(`Класс ${name} не найден`);
        const { data, proto } = klass;
        this.proto = proto;
        //Создаем переменные этого объекта,
        if (data.vars) this.vars = data.vars.map(v => new VariableGraphNode(v.name.toLowerCase(), v.type, reqIndex));
        //создаем детей,
        if (data.childs) {
            const childs = (this.childs = HandleMap.create<VarStore>());
            data.childs.forEach(c => {
                const childStore = new VarStore(c.classname, classes, reqIndex, {
                    handle: c.handle,
                    name: c.nameOnScheme,
                    position: c.position
                });
                childs.set(c.handle, childStore);
            });
        }
        // и создаем связи между переменными этого объекта и переменными его детей.
        if (data.links) linkVars(data.links, this, this.childs);
    }

    toSchemeNode(parentData?: SchemeData): ClassSchemeNode {
        const { vars, proto, childs } = this;
        const opts: ConstructorParameters<typeof ClassSchemeNode>[0] = {
            proto,
            globalIndexMap: vars && vars.map(v => v.extractIndex()),
            schemeData: parentData
        };
        const parentNode = new ClassSchemeNode(opts);
        if (childs) {
            const nodeChilds = HandleMap.create<ClassSchemeNode>();
            childs.forEach((c, handle) =>
                nodeChilds.set(handle, c.toSchemeNode(c.schemeData && { ...c.schemeData, parent: parentNode }))
            );
            parentNode.setChilds(nodeChilds);
        }
        return parentNode;
    }
}

export function createClassScheme(
    rootName: string,
    classes: Map<string, ClassData>
): { mmanager: MemoryManager; root: ClassSchemeNode } {
    const protos = dataToProtos(classes);
    let varCount = 0;
    const counter = () => varCount++;
    const head = new VarStore(rootName, protos, counter);
    const root = head.toSchemeNode();
    const mmanager = new MemoryManager(varCount);
    root.initDefaultValuesRecursive(mmanager);
    mmanager.assertDefaultValuesInitialized();
    return { mmanager, root };
}
