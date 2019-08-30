import { StratumChildInfo, StratumLinkInfo, StratumVarInfo, StratumVarSet } from "./deserializers";
import { VmCode } from "./deserializers/vmCode";
import { StratumError } from "./errors";
import { IClassInstance, IVirtualMachine } from "./vm/interfaces";

type VarValue = { new: number | string; old: number | string; def?: number | string };
type NodeVar = { varReference?: VarValue; type: StratumVarInfo["type"]; START?: boolean; connected: NodeVar[] };

interface ClassChilds extends Array<ClassInstance> {
    byHandle: Map<number, ClassInstance>;
}

function getDefaultTypeValue(type: StratumVarInfo["type"]) {
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

export default class ClassInstance implements IClassInstance {
    private static specialVars = new Map<string, (ci: ClassInstance) => string | number | undefined>([
        ["FLOAT orgx", ({ onSchemeData: osd }) => osd && osd.data.position.x],
        ["FLOAT orgy", ({ onSchemeData: osd }) => osd && osd.data.position.y],
        ["HANDLE _hobject", ({ onSchemeData: osd }) => osd && osd.data.handle],
        ["STRING _objname", ({ onSchemeData: osd }) => osd && osd.data.name],
        ["STRING _classname", ({ protoName }) => protoName]
    ]);

    // private readonly debugName: string;
    private childs?: ClassChilds;
    private varValues?: VarValue[];

    private tempVarInfo?: {
        varsInfo: readonly StratumVarInfo[];
        nodeConnectionInfo: NodeVar[];
    };

    private varNameIdMap = new Map<string, number>();

    private isDisabled = () => false;

    /**
     * Создает новый экземпляр класса по указанному прототипу.
     * @param protoName имя прототипа класса
     * @param code исполняемый байткод класса
     * @param varsInfo информация о переменных класса
     * @param onSchemeData данные о расположении класса на схеме родительского объекта
     */
    constructor(
        readonly protoName: string,
        public code?: VmCode,
        varsInfo?: readonly StratumVarInfo[],
        private onSchemeData?: { parent: ClassInstance; data: StratumChildInfo["onSchemeData"] }
    ) {
        // this.debugName = protoName + (onSchemeData ? ` #${onSchemeData.data.handle}` : "");
        if (varsInfo) {
            this.tempVarInfo = {
                varsInfo,
                nodeConnectionInfo: varsInfo.map(v => ({ connected: [], type: v.type }))
            };
            for (let i = 0; i < varsInfo.length; i++) this.varNameIdMap.set(varsInfo[i].name.toLowerCase(), i);
            const enableVarid = this.getVarIdByName("_enable");
            const disableVarId = this.getVarIdByName("_disable");
            if (enableVarid != undefined) this.isDisabled = () => this.varValues![enableVarid].new < 1;
            if (disableVarId != undefined && (enableVarid == undefined || disableVarId < enableVarid))
                this.isDisabled = () => this.varValues![disableVarId].new > 0;
        }
    }

    //Не будем писать здесь проверок, т.к. перформанс важнее
    setNewVarValue(id: number, value: string | number): void {
        this.varValues![id].new = value;
    }
    setOldVarValue(id: number, value: string | number): void {
        this.varValues![id].old = value;
    }
    getNewVarValue(id: number): string | number {
        return this.varValues![id].new;
    }
    getOldVarValue(id: number): string | number {
        return this.varValues![id].old;
    }

    getClassesByPath(path: string): IClassInstance | IClassInstance[] | undefined {
        console.log(`getClassesByPath(${path})`);
        if (path === "") return this;
        if (path === "..") return this.onSchemeData && this.onSchemeData.parent;
        if (path === "\\") return this.onSchemeData ? this.onSchemeData.parent.getClassesByPath("\\") : this;

        throw Error(`Thats type is ${path}?`);
    }

    compute(vm: IVirtualMachine, computeChilds: boolean) {
        if (this.isDisabled()) return;
        if (computeChilds && this.childs) for (const c of this.childs) c.compute(vm, true);
        if (this.code) vm.computeClass(this.code, this);
    }

    get handle() {
        if (!this.onSchemeData) throw new Error("Объект не расположен на схеме");
        return this.onSchemeData.data.handle;
    }

    /**
     * Возвращает индекс переменной по ее имени
     * @param varName имя переменной
     */
    getVarIdByName(varName: string): number | undefined {
        return this.varNameIdMap.get(varName.toLowerCase());
    }

    /**
     * Проходит по указанному графу переменных и устанавливает всем узлам ссылку на одно и то же значение
     * @param node узел графа
     * @param ref ссылка на объект-переменную
     */
    private static traceVar(node: NodeVar, allVars: VarValue[], ref?: VarValue) {
        if (node.varReference) return;
        if (!ref) {
            ref = <VarValue>{ def: getDefaultTypeValue(node.type) };
            allVars.push(ref);
            node.START = true; //УДАЛИТЬ
        }
        node.varReference = ref;
        // node.alreadyTracer = true;
        for (const c of node.connected) ClassInstance.traceVar(c, allVars, ref);
    }

    /**
     * Рекурсивно обходит все графы переменных
     */
    private connectVars(allVars: VarValue[]) {
        if (this.tempVarInfo) this.tempVarInfo.nodeConnectionInfo.forEach(v => ClassInstance.traceVar(v, allVars));
        if (this.childs) this.childs.forEach(c => c.connectVars(allVars));
    }

    /**
     * Возвращает значение по умолчанию для указанной переменной в порядке:
     * значение по умолчанию > специальное значение (orgx, orgy...) > нет значения
     * @param id номер переменной
     * @param varsInfo информация о переменных прототипа объекта
     */
    private getDefaultValue(id: number, varsInfo: readonly StratumVarInfo[]) {
        const { defaultValue, name, type } = varsInfo[id];
        if (defaultValue != undefined) return defaultValue;

        const func = ClassInstance.specialVars.get(`${type} ${name.toLowerCase()}`);
        return func && func(this);
    }

    /**
     * Рекурсивно создает массивы переменных в порядке вычисления (дети, затем родитель)
     */
    private createVars() {
        if (this.childs) this.childs.forEach(c => c.createVars());
        if (!this.tempVarInfo) return;
        const { nodeConnectionInfo, varsInfo } = this.tempVarInfo;
        this.varValues = nodeConnectionInfo.map((v, idx) => {
            if (!v.varReference) throw new Error("Ошибка и все тут");
            const defaultValue = this.getDefaultValue(idx, varsInfo);
            if (defaultValue != undefined) v.varReference.def = defaultValue;
            return v.varReference;
        });
    }

    /**
     * Устанавливает определенные пользователем значения в порядке: родитель > дети
     * @param varSet набор переопределенных переменных
     */
    private setCustomValues(varSet: StratumVarSet) {
        const { childs: setChilds, varData } = varSet;
        if (this.varValues) {
            for (const { name, value } of varData) {
                this.varValues[this.getVarIdByName(name)!].def = value;
            }
        }

        if (!this.childs) return;
        for (const { handle, set } of setChilds) {
            const child = this.childs.byHandle.get(handle);
            if (child) child.setCustomValues(set);
            else console.warn(`Класс #${handle} не существует`);
        }
    }

    setDefaultValues(varSet?: StratumVarSet) {
        const allVars: VarValue[] = [];
        this.connectVars(allVars);
        this.createVars();
        if (varSet) this.setCustomValues(varSet);
        const delTemp = (ci: ClassInstance) => {
            delete ci.tempVarInfo;
            if (ci.childs) ci.childs.forEach(c => delTemp(c));
        };
        delTemp(this);
        return allVars;
    }

    setChilds(childs: ClassInstance[]) {
        //Костыли над типами (чтобы добавить свойство byHandle).
        this.childs = <ClassChilds>childs;
        //prettier-ignore
        (<ClassChilds>this.childs).byHandle = new Map<number, ClassInstance>(childs.map(c => [c.handle, c])).set(0, this);
    }

    private static connectObjectVars(first: ClassInstance, second: ClassInstance, vars: StratumLinkInfo["vars"]) {
        const fInfo = first.tempVarInfo;
        const sInfo = second.tempVarInfo;
        if (!fInfo || !sInfo) throw new StratumError(`Ошибка при создании связи ${first}-${second}:${vars}`);
        for (const { name1, name2 } of vars) {
            const firstId = first.getVarIdByName(name1);
            const secondId = second.getVarIdByName(name2);
            if (firstId === undefined || secondId === undefined) throw new StratumError("Переменных не существует");

            if (first == second && firstId == secondId) continue;

            const firstNode = fInfo.nodeConnectionInfo[firstId];
            const secondNode = sInfo.nodeConnectionInfo[secondId];

            firstNode.connected.push(secondNode);
            secondNode.connected.push(firstNode);
        }
    }

    setLinks(links: readonly StratumLinkInfo[]) {
        if (!this.childs) {
            //Если детей нет, то установим только связи с самим собой
            for (const l of links) {
                if (l.handle1 != 0 || l.handle2 != 0)
                    throw new StratumError(`Невозможно провести связь ${l.handle1}-${l.handle2}:${l.vars}`);
                ClassInstance.connectObjectVars(this, this, l.vars);
            }
            return;
        }

        for (const { handle1, handle2, vars } of links) {
            const first = this.childs.byHandle.get(handle1);
            const second = this.childs.byHandle.get(handle2);
            if (!first || !second)
                throw new StratumError(`Ошибка при создании связи ${handle1}-${handle2}: объект не найден`);
            ClassInstance.connectObjectVars(first, second, vars);
        }
    }
}
