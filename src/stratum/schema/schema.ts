import { ClassLibrary } from "stratum/common/classLibrary";
import { ClassProto } from "stratum/common/classProto";
import { parseVarValue } from "stratum/common/parseVarValue";
import { VarType } from "stratum/fileFormats/cls";
import { VariableSet } from "stratum/fileFormats/stt";
import { Point2D } from "stratum/helpers/types";
import { ClassModel, Enviroment, EventCode, EventSubscriber, SchemaFunctions } from "stratum/translator";
import { MemoryManagerArgs } from ".";
import { buildSchema } from "./buildSchema";
import { VarGraphNode } from "./varGraphNode";

/**
 * Описание размещения имиджа на схеме.
 */
export interface PlacementDescription {
    parent: Schema;
    handle: number;
    position: Point2D;
    name: string;
}

export class Schema implements SchemaFunctions, EventSubscriber {
    static build(root: string, lib: ClassLibrary, env: Enviroment) {
        return buildSchema(root, lib, env);
    }

    private readonly env: Enviroment;
    private readonly neighMapUC: Map<string, Schema>;
    private readonly root: Schema;
    private readonly parent: Schema = this;
    private readonly handle: number = 0;
    private readonly name: string = "";
    private readonly position: Point2D = { x: 0, y: 0 };

    private children: Schema[] = [];

    private readonly varGraphNodes: VarGraphNode[] = [];
    private isDisabled: (s: Schema) => boolean = Schema.alwaysEnabled;

    readonly proto: ClassProto;
    readonly TLB: SchemaFunctions["TLB"] = new Uint16Array(0);

    captureEventsFromSpace = 0;
    constructor(proto: ClassProto, env: Enviroment, placement?: PlacementDescription) {
        this.proto = proto;
        this.env = env;
        if (placement) {
            this.handle = placement.handle;
            this.name = placement.name;
            this.position = placement.position;
            this.parent = placement.parent;
        }

        const vars = proto.vars;
        if (vars) {
            this.varGraphNodes = vars.types.map((t) => new VarGraphNode(t));
            this.TLB = new Uint16Array(vars.count);

            const enableId = this.proto._enableVarId;
            const disableId = this.proto._disableVarId;
            if (enableId > 0 && (disableId < 0 || enableId < disableId)) {
                this.isDisabled = Schema.disabledByEnable;
            }
            if (disableId > 0 && (enableId < 0 || disableId < enableId)) {
                this.isDisabled = Schema.disabledByDisable;
            }
        }
        {
            let root: Schema = this;
            while (root.parent !== root) root = root.parent;
            this.root = root;
            this.neighMapUC = new Map([
                ["", this],
                ["\\", root],
            ]);
            if (placement) this.neighMapUC.set("..", placement.parent);
        }
    }

    // ComputableSchema
    getHObject() {
        return this.handle;
    }

    getClassName(path: string) {
        const resolved = this.resolve(path);
        if (resolved === undefined) return "";
        return resolved.proto.name;
    }

    setVar(objectName: string, varName: string, value: number | string): void {
        const target = this.resolve(objectName);
        if (target === undefined) return;
        const { vars } = target.proto;
        if (vars === undefined) return;
        const id = vars.nameUCToId.get(varName.toUpperCase());
        if (id !== undefined) target.setVarValue2(id, vars.types[id], value);
    }

    sendMessage(objectName: string, className: string, ...varNames: string[]) {
        const { env, proto, TLB } = this;
        if (env.level > 59) return;

        if (objectName !== "") throw Error(`Вызов SendMessage с objectName=${objectName} не реализован`);
        if (varNames.length % 2 !== 0) throw Error(`SendMessage: кол-во переменных должно быть четным`);

        const nameUC = className.toUpperCase();
        const receivers = this.findClasses(nameUC);
        if (receivers.length === 0) return;

        const oProto = receivers[0].proto;
        const otherModel = oProto.model;
        if (!otherModel) return;

        const myVars = proto.vars;
        const otherVars = oProto.vars;

        if (myVars === undefined || otherVars === undefined) {
            for (const rec of receivers) if (rec !== this) Schema.computeModel(otherModel, rec, env);
            return;
        }

        const idTypes = new Array<number>(varNames.length + varNames.length / 2);
        let idx = 0;
        for (let i = 0; i < varNames.length; i += 2) {
            const myVarName = varNames[i].toUpperCase();
            const myId = myVars.nameUCToId.get(myVarName);
            if (myId === undefined) continue;

            const otherVarName = varNames[i + 1].toUpperCase();
            const otherId = otherVars.nameUCToId.get(otherVarName);
            if (otherId === undefined) continue;

            const typ = myVars.types[myId];
            const otherTyp = otherVars.types[otherId];
            if (typ !== otherTyp) continue;

            idTypes[idx + 0] = TLB[myId];
            idTypes[idx + 1] = otherId;
            idTypes[idx + 2] = typ;
            idx += 3;
        }

        const { news, olds } = env.memory;
        for (const rec of receivers) {
            if (rec === this) continue;
            for (let i = 0; i < idTypes.length; i += 3) {
                const myId = idTypes[i + 0];
                if (myId === undefined) continue;
                const otherId = rec.TLB[idTypes[i + 1]];
                const typ = idTypes[i + 2];

                const newA = news[typ];
                const oldA = olds[typ];

                const val = newA[myId];
                newA[otherId] = val;
                oldA[otherId] = val;

                // olds[typ][otherId] = news[typ][otherId] = news[typ][myId];
            }
            Schema.computeModel(otherModel, rec, env);
            for (let i = 0; i < idTypes.length; i += 3) {
                const myId = idTypes[i + 0];
                if (myId === undefined) continue;
                const otherId = rec.TLB[idTypes[i + 1]];
                const typ = idTypes[i + 2];

                const newA = news[typ];
                const oldA = olds[typ];

                const val = newA[otherId];
                newA[myId] = val;
                oldA[myId] = val;
                // news[typ][myId] = news[typ][otherId];
                // olds[typ][myId] = news[typ][myId] = news[typ][otherId];
            }
        }
    }

    setCapture(hspace: number, path: string, flags: number) {
        if (path !== "") throw Error(`Вызов setCapture с path=${path} не реализован`);
        const target = /*this.resolve(path)*/ this;
        if (target === undefined || target.proto.msgVarId < 0) return;
        target.captureEventsFromSpace = hspace;
    }

    releaseCapture() {
        this.captureEventsFromSpace = 0;
    }

    registerObject(hspace: number, obj2d: number, path: string, message: number, flags: number): void;
    registerObject(wname: string, obj2d: number, path: string, message: number, flags: number): void;
    registerObject(wnameOrHspace: number | string, obj2d: number, path: string, message: number, flags: number) {
        if (path !== "") throw Error(`Вызов RegisterObject с path=${path} не реализован`);
        const target = /*this.resolve(path)*/ this;
        if (target === undefined || target.proto.msgVarId < 0) return;
        this.env.graphics!.subscribe(target, wnameOrHspace, obj2d, message);
    }
    unregisterObject(hspace: number, path: string, code: number): void;
    unregisterObject(wname: string, path: string, code: number): void;
    unregisterObject(wnameOrHspace: number | string, path: string, code: number): void {
        if (path !== "") throw Error(`Вызов UnRegisterObject с path=${path} не реализован`);
        const target = /*this.resolve(path)*/ this;
        if (target === undefined || target.proto.msgVarId < 0) return;
        this.env.graphics!.unsubscribe(target, wnameOrHspace, code);
    }

    receive(code: EventCode, ...args: (string | number)[]) {
        const { proto } = this;
        if (proto.msgVarId < 0) return;
        this.setVarValue2(proto.msgVarId, VarType.Float, code);

        switch (code) {
            case EventCode.WM_CONTROLNOTIFY:
                this.setVarValue2(proto._hobjectVarId, VarType.Handle, args[0]);
                this.setVarValue2(proto.iditemVarId, VarType.Float, args[1]);
                this.setVarValue2(proto.wnotifycodeVarId, VarType.Float, args[2]);
                break;
            case EventCode.WM_SIZE:
                this.setVarValue2(proto.nwidthVarId, VarType.Float, args[0]);
                this.setVarValue2(proto.nheightVarId, VarType.Float, args[1]);
                break;
            case EventCode.WM_MOUSEMOVE:
            case EventCode.WM_LBUTTONDOWN:
            case EventCode.WM_LBUTTONUP:
            case EventCode.WM_LBUTTONDBLCLK:
            case EventCode.WM_RBUTTONDOWN:
            case EventCode.WM_RBUTTONUP:
            case EventCode.WM_RBUTTONDBLCLK:
            case EventCode.WM_MBUTTONDOWN:
            case EventCode.WM_MBUTTONUP:
            case EventCode.WM_MBUTTONDBLCLK:
                this.setVarValue2(proto.xposVarId, VarType.Float, args[0]);
                this.setVarValue2(proto.yposVarId, VarType.Float, args[1]);
                this.setVarValue2(proto.fwkeysVarId, VarType.Float, args[2]);
                break;
        }

        const m = proto.model;
        if (m === undefined) return;

        const { env, TLB } = this;
        Schema.computeModel(m, this, env);
        // prettier-ignore
        const { memory: { newFloats, oldFloats,newInts,oldInts,newStrings,oldStrings } } = env;
        // Синхронизируем измененные в ходе вычислений переменные только на этом промежутке,
        // чтобы не гонять memoryManager.sync()
        for (const id of TLB) {
            oldFloats[id] = newFloats[id];
            oldInts[id] = newInts[id];
            oldStrings[id] = newStrings[id];
        }
    }

    // Для построения схемы.
    setChildren(children: Schema[]) {
        if (this.children.length > 0) throw Error("Изменение подимиджей не реализовано");
        (this.children = children).forEach((c) => {
            if (c.name) this.neighMapUC.set(c.name.toUpperCase(), c);
        });
        return this;
    }

    child(handle: number) {
        return this.children.find((c) => c.handle === handle);
    }

    connectVar(id: number, second: Schema, secondId: number) {
        return VarGraphNode.connect(this.varGraphNodes[id], second.varGraphNodes[secondId]);
    }

    /**
     * Рекурсивно пересоздает TLB и возвращает количество переменных каждого типа.
     *
     * Необходимо вызывать после проведения всех связей.
     */
    createTLB() {
        const mmanagerArgs: MemoryManagerArgs = {
            floatsCount: 1,
            longsCount: 1,
            stringsCount: 1,
        };

        (function rebuild({ children, TLB, varGraphNodes }: Schema) {
            children.forEach(rebuild);
            TLB.set(varGraphNodes.map((v) => v.getIndex(mmanagerArgs)));
        })(this);

        return mmanagerArgs;
    }
    /**
     * Устанавливает значения переменных по умолчанию для данного и всех дочерних имиджей.
     *
     * Замечание: Значения родительского имиджа превыше дочерних, поэтому они применяются последними.
     */
    applyDefaults() {
        this.children.forEach((c) => c.applyDefaults());

        const { vars } = this.proto;
        if (!vars) return this;

        for (let id = 0; id < vars.count; ++id) {
            const type = vars.types[id];

            //Значение по умолчанию
            const defaultValue = vars.defaultValues[id];
            if (defaultValue !== undefined) {
                this.setNewVarValue(id, type, defaultValue);
                continue;
            }

            //Если знач. по умолчанию нет, пытаемся получить специальное значение переменной.
            switch (id) {
                case this.proto.orgxVarId:
                    this.setNewVarValue(id, type, this.position.x);
                    break;
                case this.proto.orgyVarId:
                    this.setNewVarValue(id, type, this.position.y);
                    break;
                case this.proto._hobjectVarId:
                    this.setNewVarValue(id, type, this.handle);
                    break;
                case this.proto._objnameVarId:
                    this.setNewVarValue(id, type, this.name);
                    break;
                case this.proto._classnameVarId:
                    this.setNewVarValue(id, type, this.proto.name);
                    break;
            }
        }
        return this;
    }
    /**
     * Применяет к дереву имиджей набор переменных `varSet`, считанных из .stt файла.
     *
     * Замечание: Значения дочерних превыше родительских, поэтому они применяются последними.
     */
    applyVarSet(varSet: VariableSet) {
        const { name, vars } = this.proto;
        if (vars && name.toUpperCase() === varSet.classname.toUpperCase()) {
            for (const v of varSet.values) {
                const id = vars.nameUCToId.get(v.name.toUpperCase());
                if (id === undefined) continue;
                const type = vars.types[id];
                this.setNewVarValue(id, type, parseVarValue(type, v.value));
            }
        }

        varSet.childSets.forEach((s) => this.child(s.handle)?.applyVarSet(s));
        return this;
    }

    /**
     * Рекурсивно вычисляет схему имиджа.
     */
    compute() {
        if (this.isDisabled(this) === true) return;
        const { children, proto } = this;
        for (const c of children) c.compute();

        const m = proto.model;
        if (m !== undefined) Schema.computeModel(m, this, this.env);
    }

    private resolve(path: string): Schema | undefined {
        if (path === "") return this;
        const filter = path.split("\\");
        let root = path[0] === "\\" ? this.root : this;
        for (let i = 0; i < filter.length; ++i) {
            const cl = root.neighMapUC.get(filter[i]);
            if (cl === undefined) return undefined;
            root = cl;
        }
        return root;
    }

    private setNewVarValue(id: number, type: VarType, value: number | string) {
        if (id < 0) return;
        this.env.memory.news[type][this.TLB[id]] = value;
    }
    private setVarValue2(id: number, type: VarType, value: number | string) {
        if (id < 0) return;
        const trl = this.TLB[id];
        this.env.memory.olds[type][trl] = value;
        this.env.memory.news[type][trl] = value;
    }

    private classNodeCache = new Map<string, Schema[]>();
    private findClasses(classNameUC: string): Schema[] {
        const { root } = this;
        const nodes = root.classNodeCache.get(classNameUC);
        if (nodes !== undefined) return nodes;

        const nodes2 = new Array<Schema>();
        (function collect(s: Schema) {
            s.children.forEach(collect);
            if (s.proto.name.toUpperCase() === classNameUC) nodes2.push(s);
        })(root);

        root.classNodeCache.set(classNameUC, nodes2);
        return nodes2;
    }

    /*
    private static computeModelSafe(model: ClassModel, schema: Schema, env: Enviroment) {
        env.inc();
        try {
            model(schema, env);
        } catch (e) {
            if (e instanceof SchemaError) throw e;
            console.error(e);
            let root: Schema = schema;
            let path = "";
            while (root.parent !== root) {
                path = ` -> ${root.proto.name} #${root.handle}` + path;
                root = root.parent;
            }
            throw new SchemaError("Ошибка выполнения " + root.proto.name + path);
        }
        env.dec();
    }
    */

    private static computeModel(model: ClassModel, schema: Schema, env: Enviroment) {
        env.inc();
        model(schema, env);
        env.dec();
    }

    private static alwaysEnabled() {
        return false;
    }
    private static disabledByEnable({ env, proto, TLB }: Schema) {
        return env.memory.newFloats[TLB[proto._enableVarId]] <= 0;
    }
    private static disabledByDisable({ env, proto, TLB }: Schema) {
        return env.memory.newFloats[TLB[proto._disableVarId]] > 0;
    }
}
// class SchemaError extends Error {}
