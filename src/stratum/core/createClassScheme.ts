import { ClassData, VarData, LinkData } from "data-types-base";
import { ClassSchemeNode, SchemeData } from "./classSchemeNode";
import { StratumError } from "~/helpers/errors";
import { ClassPrototype } from "./classPrototype";
import { HandleMap } from "~/helpers/handleMap";
import { MemoryManager } from "./memoryManager";

class VariableGraphNode {
    private indexWasSet = false;
    private globalVarIdx = -1;
    private connectedNodes = new Set<VariableGraphNode>();

    constructor(
        readonly lowCaseName: string,
        readonly type: VarData["type"],
        private requestIndex: (type: VarData["type"]) => number
    ) {}

    static connect(first: VariableGraphNode, second: VariableGraphNode) {
        if (first.type !== second.type) throw Error("inconsistent types");
        if (first.indexWasSet) throw Error("first propagated");
        if (second.indexWasSet) throw Error("second propagated");
        first.connectedNodes.add(second);
        second.connectedNodes.add(first);
    }

    private shareIdxWithOthers(index: number) {
        if (this.indexWasSet) return;
        this.indexWasSet = true;
        this.globalVarIdx = index;
        this.connectedNodes.forEach((n) => n.shareIdxWithOthers(index));
    }

    getIndexAndType(): { globalIdx: number; type: VarData["type"] } {
        if (!this.indexWasSet) {
            const index = this.requestIndex(this.type);
            this.shareIdxWithOthers(index);
        }
        return { globalIdx: this.globalVarIdx, type: this.type };
    }
}

/**
 * Соединяет переменные нескольких объектов.
 * @param links данные о связях между переменными объектов
 * @param parent объект с дескриптором #0
 * @param childs карта объектов с дескрипторами от #1 и далее
 */
function linkVars(links: LinkData[], parent: VarArrayNode, childs?: HandleMap<VarArrayNode>) {
    const show_warn = (msg: string) => console.warn(`Имидж ${parent.protoName}: ${msg}`);
    for (const { handle1, handle2, connectedVars } of links) {
        //Получаем соединяемые объекты
        const first = handle1 ? childs && childs.get(handle1) : parent;
        const second = handle2 ? childs && childs.get(handle2) : parent;

        if (!first) show_warn(`Объект #${handle1} не найден`);
        else if (!first.vars) show_warn(`Объект #${handle1} не имеет переменных`);
        if (!second) show_warn(`Объект #${handle2} не найден`);
        else if (!second.vars) show_warn(`Объект #${handle2} не имеет переменных`);

        if (!first || !first.vars || !second || !second.vars) continue;

        const obj1Name = `дочернем имидже ${first.protoName} #${handle1}`;
        const obj2Name = `дочернем имидже ${second.protoName} #${handle2}`;

        for (const { name1, name2 } of connectedVars) {
            //Получаем соединяемые переменные.
            const var1 = first.vars.find((v) => v.lowCaseName === name1.toLowerCase());
            const var2 = second.vars.find((v) => v.lowCaseName === name2.toLowerCase());

            if (var1 === undefined) show_warn(`Переменная ${name1} не найдена в ${obj1Name}`);
            if (var2 === undefined) show_warn(`Переменная ${name2} не найдена в ${obj2Name}`);
            if (var1 === undefined || var2 === undefined) continue;
            if (var1.type === var2.type) VariableGraphNode.connect(var1, var2);
            else show_warn(`Типы переменных ${name1} в ${obj1Name} и ${name2} в ${obj2Name} не совпадают`);
        }
    }
}

class VarArrayNode {
    private proto: ClassPrototype;
    readonly vars?: VariableGraphNode[];
    private childs?: HandleMap<VarArrayNode>;
    constructor(
        name: string,
        classes: Map<string, { childInfo: ClassData["childInfo"]; links: ClassData["links"]; proto: ClassPrototype }>,
        reqIndex: (type: VarData["type"]) => number,
        private schemeData?: Omit<SchemeData, "parent">
    ) {
        const klass = classes.get(name);
        if (!klass) throw new StratumError(`Класс ${name} не найден`);
        const { childInfo, links, proto } = klass;
        this.proto = proto;
        //Создаем переменные этого объекта,
        if (proto.variables)
            this.vars = proto.variables.map((v) => new VariableGraphNode(v.lowCaseName, v.type, reqIndex));
        //создаем детей,
        if (childInfo) {
            const childs = (this.childs = HandleMap.create<VarArrayNode>());
            childInfo.forEach((c) => {
                const childStore = new VarArrayNode(c.classname, classes, reqIndex, {
                    handle: c.handle,
                    name: c.nameOnScheme,
                    position: c.position,
                });
                childs.set(c.handle, childStore);
            });
        }
        // и создаем связи между переменными этого объекта и переменными его детей.
        if (links) linkVars(links, this, this.childs);
    }

    get protoName() {
        return this.proto.name;
    }

    toClassSchemeNode(parentData?: SchemeData): ClassSchemeNode {
        const { vars, proto, childs } = this;
        const parentNode = new ClassSchemeNode({
            proto,
            varIndexMap: vars && vars.map((v) => v.getIndexAndType()),
            schemeData: parentData,
        });
        if (childs) {
            const nodeChilds = HandleMap.create<ClassSchemeNode>();
            childs.forEach((c, handle) =>
                nodeChilds.set(handle, c.toClassSchemeNode(c.schemeData && { ...c.schemeData, parent: parentNode }))
            );
            parentNode.setChilds(nodeChilds);
        }
        return parentNode;
    }
}

function dataToProtos(classes: Map<string, ClassData>) {
    const protos = new Map<
        string,
        { links: ClassData["links"]; childInfo: ClassData["childInfo"]; proto: ClassPrototype }
    >();
    classes.forEach((data, name) =>
        protos.set(name, {
            links: data.links,
            childInfo: data.childInfo,
            proto: new ClassPrototype(name, { vars: data.vars, code: data.bytecode && data.bytecode.parsed }),
        })
    );
    return protos;
}

//ClassData -> ClassPrototype(ClassData) -> VarArrayNode(ClassData, ClassPrototype) -> ClassSchemeNode(VarArrayNode, ClassPrototype)

export function createClassScheme(
    rootName: string,
    classLibrary: Map<string, ClassData>
): { mmanager: MemoryManager; root: ClassSchemeNode } {
    //Переводим "сырые" считанные данные в прототипы классов.
    const protos = dataToProtos(classLibrary);

    //резервируем нуль, чтобы проверять есть ли где то ошибки.
    let doubleVarCount = 1,
        longVarCount = 1,
        stringVarCount = 1;
    const counter = (type: VarData["type"]) => {
        switch (type) {
            case "FLOAT":
                return doubleVarCount++;
            case "HANDLE":
                return longVarCount++;
            case "COLORREF":
            case "STRING":
                return stringVarCount++;
        }
    };

    //Создаем граф переменных и конвертируем его в граф классов.
    const root = new VarArrayNode(rootName, protos, counter).toClassSchemeNode();

    const mmanager = new MemoryManager({ doubleVarCount, longVarCount, stringVarCount });
    //Инициализируем память каждого узла графа.
    root.initDefaultValuesRecursive(mmanager);
    // mmanager.assertDefaultValuesInitialized();

    return { mmanager, root };
}
