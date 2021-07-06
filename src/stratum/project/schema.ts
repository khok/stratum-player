import { ClassProto } from "stratum/classLibrary";
import { Constant, WM_CHAR } from "stratum/common/constant";
import { parseVarValue } from "stratum/common/parseVarValue";
import { EventSubscriber } from "stratum/common/types";
import { MemorySize, VarGraphNode } from "stratum/common/varGraphNode";
import { VarType } from "stratum/common/varType";
import { ComputeResult, installContextFunctions, SchemaContextFunctions } from "stratum/compiler";
import { ClassChildInfo, ClassLinkInfo } from "stratum/fileFormats/cls";
import { VariableSet } from "stratum/fileFormats/stt";
import { Point2D } from "stratum/helpers/types";
import { applyLinks } from "./applyLinks";
import { Project } from "./project";

/**
 * Вычисляемый узел схемы (объект). Ее прототипом является имидж (`ClassProto`).
 */
export class Schema implements EventSubscriber, SchemaContextFunctions {
    private static alwaysEnabled() {
        return false;
    }
    private static disabledByEnable(schema: Schema) {
        return schema.prj.newFloats[schema.TLB[schema.disOrEnVarId]] <= 0;
    }
    private static disabledByDisable(schema: Schema) {
        return schema.prj.newFloats[schema.TLB[schema.disOrEnVarId]] > 0;
    }

    private readonly handle: number;
    private readonly resolveMap: Map<string, Schema>;

    private parent: Schema | null;
    private children: Schema[] = [];

    private isDisabled: (s: Schema) => boolean = Schema.alwaysEnabled;
    private disOrEnVarId: number = -1;
    private varGraphNodes: VarGraphNode[] = [];
    private schemeName: string;
    private position: Point2D;

    private TLB: Uint16Array;

    readonly prj: Project;
    readonly proto: ClassProto;

    constructor(prj: Project, proto: ClassProto, children: Schema[], links: ClassLinkInfo[], placement?: ClassChildInfo) {
        proto.model(); //Компиляция перед выполнением.
        this.proto = proto;
        this.prj = prj;
        {
            const vars = proto.vars();
            this.varGraphNodes = vars.toArray().map((v) => new VarGraphNode(v.type));
            this.TLB = new Uint16Array(vars.count());

            const enableId = vars._enableVarId;
            const disableId = vars._disableVarId;
            if (enableId > -1 && (disableId < 0 || enableId < disableId)) {
                this.isDisabled = Schema.disabledByEnable;
                this.disOrEnVarId = enableId;
            }
            if (disableId > -1 && (enableId < 0 || disableId < enableId)) {
                this.isDisabled = Schema.disabledByDisable;
                this.disOrEnVarId = disableId;
            }
        }
        this.children = children;
        applyLinks(this, links);
        this.resolveMap = new Map([["", this]]);

        children.forEach((c) => {
            this.resolveMap.set("#" + c.handle, c);
            if (c.schemeName) this.resolveMap.set(c.schemeName.toUpperCase(), c);
        });

        this.parent = null;
        children.forEach((c) => c.setParent(this));
        if (placement) {
            this.handle = placement.handle;
            this.schemeName = placement.schemeName;
            this.position = placement.position;
        } else {
            this.handle = 0;
            this.schemeName = "";
            this.position = { x: 0, y: 0 };
        }
    }

    private setParent(parent: Schema): void {
        if (parent === this || this.parent !== null) throw Error("Невозможно изменить родительский имидж");
        this.parent = parent;
        this.resolveMap.set("..", parent);
    }

    private resolve(path: string): Schema | undefined {
        if (path === "") return this;
        const filter = path.toUpperCase().split("\\"); //.map((c) => c.trim());
        let root = path[0] === "\\" ? this.prj.root : this;

        // for (let i = 0; i < filter.length; ++i) {
        //     const f = filter[i];
        //     if (f.length === 0) continue;

        //     if (f === "..") {
        //         const p = root.parent;
        //         if (!p) return undefined;
        //         root = p;
        //         continue;
        //     }

        //     if (f.startsWith("#")) {
        //         const h = parseInt(f.substring(1));
        //         if (isNaN(h)) return undefined;
        //         const child = root.children.find((c) => c.handle === h);
        //         if (!child) return undefined;
        //         root = child;
        //         continue;
        //     }

        //     const child = root.children.find((c) => c.schemeName === f);
        //     if (!child) return undefined;
        //     root = child;
        // }

        for (let i = 0; i < filter.length; ++i) {
            const cl = root.resolveMap.get(filter[i]);
            if (typeof cl === "undefined") {
                // console.log(this);
                // console.log(this.prj.root);
                // console.log(this.prj.root.children.map((c) => c.schemeName));
                // console.log(this.children.map((c) => c.schemeName));
                // if (filter[i] !== ".." && filter[i][0] !== "#") throw Error(`Не удалось разрешить путь ${path}`);
                return undefined;
            }
            root = cl;
        }
        return root;
    }

    private classNodeCache = new Map<string, Schema[]>();
    private findClasses(classNameUC: string): Schema[] {
        const { root } = this.prj;
        const nodes = root.classNodeCache.get(classNameUC);
        if (typeof nodes !== "undefined") return nodes;

        const nodes2 = new Array<Schema>();
        (function collect(s: Schema) {
            s.children.forEach(collect);
            if (s.proto.name.toUpperCase() === classNameUC) nodes2.push(s);
        })(root);

        root.classNodeCache.set(classNameUC, nodes2);
        return nodes2;
    }

    private setVarValue(id: number, type: VarType, value: number | string): boolean {
        if (id < 0) return false;
        const realId = this.TLB[id];
        this.prj.setOldValue(realId, type, value);
        this.prj.setNewValue(realId, type, value);
        // this.prj.olds[type][realId] = value;
        // this.prj.news[type][realId] = value;
        return true;
    }

    private getVarValue(id: number, type: VarType.String): string;
    private getVarValue(id: number, type: VarType.Float): number;
    private getVarValue(id: number, type: VarType.Handle): number;
    private getVarValue(id: number, type: VarType.ColorRef): number;
    private getVarValue(id: number, type: VarType): string | number {
        return this.prj.getNewValue(this.TLB[id], type);
    }

    private *computeSchema(): ComputeResult {
        for (let i = 0; i < this.children.length; ++i) {
            const c = this.children[i];
            if (c.isDisabled(c)) continue;
            yield* c.computeSchema();
        }
        const mod = this.proto.model();
        if (!mod) return;
        yield* mod.compute(this.TLB, this.prj, this);
    }

    child(handle: number): Schema | null {
        return this.children.find((c) => c.handle === handle) ?? null;
    }

    connectVar(id: number, second: Schema, secondId: number, isDisabled: number): boolean {
        if (isDisabled) return true;
        return VarGraphNode.connect(this.varGraphNodes[id], second.varGraphNodes[secondId]);
    }

    receive(code: Constant, ...args: (string | number)[]): Promise<void> {
        const env = this.prj.env;
        if (env.isWaiting()) return Promise.resolve();

        const vars = this.proto.vars();
        if (this.setVarValue(vars.msgVarId, VarType.Float, code) === false) return Promise.resolve();

        switch (code) {
            case Constant.WM_CONTROLNOTIFY:
                this.setVarValue(vars._hobjectVarId, VarType.Handle, args[0]);
                this.setVarValue(vars.iditemVarId, VarType.Float, args[1]);
                this.setVarValue(vars.wnotifycodeVarId, VarType.Float, args[2]);
                break;
            case Constant.WM_SIZE:
                this.setVarValue(vars.nwidthVarId, VarType.Float, args[0]);
                this.setVarValue(vars.nheightVarId, VarType.Float, args[1]);
                break;
            case Constant.WM_MOUSEMOVE:
            case Constant.WM_LBUTTONDOWN:
            case Constant.WM_LBUTTONUP:
            case Constant.WM_LBUTTONDBLCLK:
            case Constant.WM_RBUTTONDOWN:
            case Constant.WM_RBUTTONUP:
            case Constant.WM_RBUTTONDBLCLK:
            case Constant.WM_MBUTTONDOWN:
            case Constant.WM_MBUTTONUP:
            case Constant.WM_MBUTTONDBLCLK:
                this.setVarValue(vars.xposVarId, VarType.Float, args[0]);
                this.setVarValue(vars.yposVarId, VarType.Float, args[1]);
                this.setVarValue(vars.fwkeysVarId, VarType.Float, args[2]);
                break;
            case Constant.WM_KEYDOWN:
            case Constant.WM_KEYUP:
            case WM_CHAR:
                this.setVarValue(vars.wVkeyVarId, VarType.Float, args[0]);
                this.setVarValue(vars.repeatVarId, VarType.Float, args[1]);
                this.setVarValue(vars.scanCodeVarId, VarType.Float, args[2]);
                break;
        }

        return this.compute(true);
    }

    /**
     * Рекурсивно вычисляет схему имиджа.
     */
    async compute(force = false): Promise<void> {
        if (!force && this.isDisabled(this)) return;

        const gen = this.computeSchema();
        while (true) {
            const r = gen.next();
            if (r.done) break;
            this.prj.env.setWaiting();
            await r.value;
            this.prj.env.resetWaiting();
        }

        const prj = this.prj;
        prj.oldFloats.set(prj.newFloats);
        prj.oldInts.set(prj.newInts);
        const ns = prj.newStrings;
        for (let i = 0; i < ns.length; ++i) prj.oldStrings[i] = ns[i];
        Schema.assertZeroIndexEmpty(prj);
    }

    /**
     * Рекурсивно пересоздает TLB и возвращает количество переменных каждого типа.
     *
     * Необходимо вызывать после проведения всех связей.
     */
    createTLB(): MemorySize {
        const memSize: MemorySize = {
            floatsCount: 1,
            intsCount: 1,
            stringsCount: 1,
        };

        (function rebuild({ children, TLB, varGraphNodes }: Schema) {
            children.forEach(rebuild);
            TLB.set(varGraphNodes.map((v) => v.getIndex(memSize)));
        })(this);

        return memSize;
    }
    /**
     * Устанавливает значения переменных по умолчанию для данного и всех дочерних имиджей.
     *
     * Замечание: Значения родительского имиджа превыше дочерних, поэтому они применяются последними.
     */
    applyDefaults(): this {
        this.children.forEach((c) => c.applyDefaults());

        const vars = this.proto.vars();
        const len = vars.count();
        for (let id = 0; id < len; ++id) {
            const v = vars.data(id);
            const type = v.type;

            //Значение по умолчанию
            const defaultValue = v.defaultValue;
            if (defaultValue !== null) {
                this.setVarValue(id, type, defaultValue);
                continue;
            }

            //Если знач. по умолчанию нет, пытаемся получить специальное значение переменной.
            switch (id) {
                case vars.orgxVarId:
                    this.setVarValue(id, type, this.position.x);
                    break;
                case vars.orgyVarId:
                    this.setVarValue(id, type, this.position.y);
                    break;
                case vars._hobjectVarId:
                    this.setVarValue(id, type, this.handle);
                    break;
                case vars._objnameVarId:
                    this.setVarValue(id, type, this.schemeName);
                    break;
                case vars._classnameVarId:
                    this.setVarValue(id, type, this.proto.name);
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
    applyVarSet(varSet: VariableSet): this {
        if (this.proto.name.toUpperCase() === varSet.classname.toUpperCase()) {
            const vars = this.proto.vars();

            const { values } = varSet;
            for (let i = 0; i < values.length; ++i) {
                const v = values[i];

                const id = vars.id(v.name);
                if (id === null) continue;

                const type = vars.data(id).type;
                this.setVarValue(id, type, parseVarValue(type, v.value));
            }
        }

        varSet.childSets.forEach((s) => this.child(s.handle)?.applyVarSet(s));
        return this;
    }

    private path(): string {
        let root: Schema = this;
        let path = "";
        while (root.parent) {
            path = ` -> ${root.proto.name} #${root.handle}${path}`;
            root = root.parent;
        }
        return this.prj.root.proto.name + path;
    }

    stubCall(name: string, args: (string | number)[]): never {
        throw Error(`Вызов нереализованной функции ${name}(${args.map((a) => typeof a).join(",")})\nв ${this.path()}`);
    }

    copyNewValuesToOld(): void {
        const ids = this.TLB;
        const { newFloats, oldFloats, newInts, oldInts, newStrings, oldStrings } = this.prj;
        for (const id of ids) {
            oldFloats[id] = newFloats[id];
            oldInts[id] = newInts[id];
            oldStrings[id] = newStrings[id];
        }
    }

    /**
     * Проверка, не было ли изменено (в результате багов) зарезервированное значение.
     */
    private static assertZeroIndexEmpty(prj: Project) {
        if (
            prj.oldFloats[0] !== 0 ||
            "undefined" in prj.oldFloats ||
            prj.newFloats[0] !== 0 ||
            "undefined" in prj.newFloats ||
            prj.oldInts[0] !== 0 ||
            "undefined" in prj.oldInts ||
            prj.newInts[0] !== 0 ||
            "undefined" in prj.newInts ||
            prj.oldStrings[0] !== "" ||
            "undefined" in prj.oldStrings ||
            prj.newStrings[0] !== "" ||
            "undefined" in prj.newStrings
        )
            throw Error("Было изменено зарезервированное значение переменной");
    }

    //#region Реализации функций.
    stratum_async_test_sleep_8210460217466098(data: number): string | Promise<string> {
        if (data === 0) return "";
        return new Promise((res) => setTimeout(res, data)).then(() => "wait" + data);
    }
    stratum_getHObject(): number {
        return this.handle;
    }

    stratum_getHObjectByName(path: string): number {
        return this.resolve(path)?.handle ?? 0;
    }

    stratum_getClassName(path: string): string {
        const resolved = this.resolve(path);
        if (typeof resolved === "undefined") return "";
        return resolved.proto.name;
    }

    stratum_setVar(objectName: string, varName: string, value: number | string): void {
        const target = this.resolve(objectName);
        if (!target) return;

        const vars = target.proto.vars();
        const id = vars.id(varName);
        if (id !== null) target.setVarValue(id, vars.data(id).type, value);
    }

    stratum_getVarS(objectName: string, varName: string): string {
        const target = this.resolve(objectName);
        if (!target) return "";

        const vars = target.proto.vars();
        const id = vars.id(varName);
        return id !== null ? target.getVarValue(id, VarType.String) : "";
    }
    stratum_getVarF(objectName: string, varName: string): number {
        const target = this.resolve(objectName);
        if (!target) return 0;

        const vars = target.proto.vars();
        const id = vars.id(varName);
        return id !== null ? target.getVarValue(id, VarType.Float) : 0;
    }
    stratum_getVarH(objectName: string, varName: string): number {
        const target = this.resolve(objectName);
        if (!target) return 0;

        const vars = target.proto.vars();
        const id = vars.id(varName);
        return id !== null ? target.getVarValue(id, VarType.Handle) : 0;
    }
    stratum_getVarC(objectName: string, varName: string): number {
        const target = this.resolve(objectName);
        if (!target) return 0;

        const vars = target.proto.vars();
        const id = vars.id(varName);
        return id !== null ? target.getVarValue(id, VarType.ColorRef) : 0;
    }

    // private idTypes: number[] = [];
    // private cachedNames: string[] = [];
    *stratum_async_sendMessage(objectName: string, className: string, ...varNames: string[]): ComputeResult {
        const { prj, TLB /*cachedNames*/ } = this;
        if (prj.canExecute() === false) return;

        // if (varNames.length % 2 !== 0) throw Error(`SendMessage: кол-во переменных должно быть четным`);

        let receivers: Schema[] | null = null;
        if (objectName !== "") {
            const res = this.resolve(objectName);
            if (res) {
                receivers = [res];
            }
        }

        if (className !== "") {
            const nameUC = className.toUpperCase();
            receivers = receivers?.filter((r) => r.proto.name.toUpperCase() === nameUC) ?? this.findClasses(nameUC);
        }

        if (!receivers || receivers.length === 0) return;

        const myVars = this.proto.vars();
        const otherVars = receivers[0].proto.vars();

        // if (myVars.count === 0 || otherVars.count === 0) {
        //     for (const rec of receivers) {
        //         if (rec === this) continue;
        //         prj.inc();
        //         rec.forceCompute();
        //         prj.syncLocal(rec.TLB);
        //         prj.dec();
        //     }
        //     return;
        // }

        // let cached = varNames.length === cachedNames.length;
        // if (cached === true) {
        //     for (let i = 0; i < varNames.length; ++i) {
        //         if (varNames[i] !== cachedNames[i]) {
        //             cached = false;
        //             break;
        //         }
        //     }
        // }

        // if (cached === false) {
        // this.cachedNames = varNames;
        // const idTypes = (this.idTypes = new Array<number>(varNames.length + varNames.length / 2));
        const idTypes = new Array<number>(varNames.length * 1.5);
        let idx = 0;
        for (let i = 0; i < varNames.length; i += 2) {
            const myId = myVars.id(varNames[i]);
            if (myId === null) continue;

            const otherId = otherVars.id(varNames[i + 1]);
            if (otherId === null) continue;

            const typ = myVars.data(myId).type;
            const otherTyp = otherVars.data(otherId).type;
            if (typ !== otherTyp) continue;

            idTypes[idx + 0] = typ;
            idTypes[idx + 1] = myId;
            idTypes[idx + 2] = otherId;
            idx += 3;
        }
        // }

        // const { idTypes } = this;
        // const { news, olds } = prj;
        for (let rid = 0; rid < receivers.length; ++rid) {
            const rec = receivers[rid];
            if (rec === this) continue;

            for (let i = 0; i < idTypes.length; i += 3) {
                const typ = idTypes[i + 0];
                if (typeof typ === "undefined") continue;
                const myId = TLB[idTypes[i + 1]];
                const otherId = rec.TLB[idTypes[i + 2]];

                // const newArr = news[typ];
                // const oldArr = olds[typ];

                // const val = newArr[myId];
                // newArr[otherId] = val;
                // oldArr[otherId] = val;
                const val = prj.getNewValue(myId, typ);
                prj.setNewValue(otherId, typ, val);
                prj.setOldValue(otherId, typ, val);
            }

            prj.inc();
            yield* rec.computeSchema();
            rec.copyNewValuesToOld();
            prj.dec();

            for (let i = 0; i < idTypes.length; i += 3) {
                const typ = idTypes[i + 0];
                if (typeof typ === "undefined") continue;
                const myId = TLB[idTypes[i + 1]];
                const otherId = rec.TLB[idTypes[i + 2]];

                // const newArr = news[typ];
                // newArr[myId] = newArr[otherId];
                const val = prj.getNewValue(otherId, typ);
                prj.setNewValue(myId, typ, val);
            }
        }
    }

    stratum_setCapture(hspace: number, path: string, flags: number): void {
        const target = this.resolve(path);
        if (!target || target.proto.vars().msgVarId < 0) return;
        this.prj.env.setCapture(target, hspace, flags);
    }

    stratum_registerObject(wnameOrHspace: number | string, obj2d: number, path: string, message: number, flags: number): void {
        const target = this.resolve(path);
        if (!target || target.proto.vars().msgVarId < 0) return;
        this.prj.env.subscribe(target, wnameOrHspace, obj2d, message, flags);
    }

    stratum_unregisterObject(wnameOrHspace: number | string, path: string, message: number): void {
        const target = this.resolve(path);
        if (!target || target.proto.vars().msgVarId < 0) return;
        this.prj.env.unsubscribe(target, wnameOrHspace, message);
    }
    //#endregion
}
installContextFunctions(Schema, "schema");
