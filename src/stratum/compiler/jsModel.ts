import { MemorySize, VarGraphNode } from "stratum/common/varGraphNode";
import { VarType } from "stratum/common/varType";
import { options } from "stratum/options";
import { CodeGenerator, funcHeader, schemaHeader } from "./codeGenerator";
import { memArg, modelArg, retCodeArg, schemaArg, TLBArg } from "./compilerConsts";
import {
    ClassModel,
    ComputeResult,
    InternalClassModel,
    ModelLibrary,
    PossibleValue,
    SchemaContextFunctions,
    SchemaMemory,
    VarInfo,
    WaitingTarget,
} from "./compilerTypes";
import { moreFunctions } from "./moreFunctions";
import { normalizeSource } from "./normalizer";
import { CodeLine, parse } from "./parser";
import { unreleasedFunctions } from "./unreleasedFunctions";

type ComputeFunction = (retCode: number, model: InternalClassModel, TLB: ArrayLike<number>, mem: SchemaMemory, schema: SchemaContextFunctions) => number;
const computeFuncParams = [retCodeArg, modelArg, TLBArg, memArg, schemaArg];

class JsModel implements InternalClassModel {
    static noModel(): number {
        return 0;
    }
    private _func: ComputeFunction;
    private lib: ModelLibrary;
    readonly isFunction: boolean;
    readonly vars: ReadonlyArray<VarInfo>;
    constructor(source: string, lib: ModelLibrary, objname: string, rawVars?: ReadonlyArray<VarInfo> | null) {
        this.lib = lib;

        // 1) Нормируем (вырезаем комменты, заменяем точки на \n) исходник
        const norm = normalizeSource(source);

        // 2) Парсим AST
        let ast: CodeLine[];
        try {
            ast = parse(norm);
        } catch (e) {
            console.dir(e);
            console.log(norm);
            const st = e.location.start;
            throw Error(`Ошибка парсинга ${objname}, строка ${st.line} столбец ${st.column}: ${e.message}`);
        }
        if (ast.length === 0) {
            this._func = JsModel.noModel;
            this.isFunction = false;
            this.vars = [];
            return;
        }

        // 3) Генерируем JS код из AST, достаем описания переменных
        let t: CodeGenerator;
        try {
            t = new CodeGenerator(ast, lib, rawVars);
        } catch (e) {
            // prettier-ignore
            console.log(norm.split("\n").filter(s => s.trim()).map((s, idx) => `${idx + 1}: ${s}`).join("\n"));
            throw Error(`Ошибка трансляции ${objname}: ${e.message}`);
        }

        if (t.hasEquations()) console.warn(`Уравнения в ${objname} не реализованы`);
        if (t.hasBug()) console.warn(`${objname}: игнорируется применение оператора '~' к не переменной`);
        this.isFunction = t.hasFunctionDecl();
        this.vars = t.vars();

        const res = t.result();
        if (res.length === 0) {
            this._func = JsModel.noModel;
            return;
        }

        // 4) Добавляем необходимые заголовки, внутренние функции.
        const headerFuncs = t.innerFunctions();
        const fHeader = headerFuncs.map((nm) => moreFunctions.get(nm)).join("\n");

        const funcs = t.missingFuncs;
        if (funcs.size > 0) console.warn(`Функции ${[...funcs.values()].join(", ")} в ${objname} не реализованы.`);
        funcs.forEach((v, k) => unreleasedFunctions.set(k, v));

        const body = res.join("\n");
        const js = fHeader + (this.isFunction ? funcHeader : schemaHeader) + body + `//# sourceURL=${objname}`;
        // console.log(js);

        // 5) Вызываем eval.
        options.log("Компилятор:", `Компилируем ${objname}${this.isFunction ? " как функцию " : ""}`);
        try {
            this._func = new Function(...computeFuncParams, js) as ComputeFunction;
        } catch (e) {
            // prettier-ignore
            console.log(norm.split("\n").filter(s => s.trim()).map((s, idx) => `${idx + 1}: ${s}`).join("\n"));
            console.log(body);
            throw Error(`Ошибка eval ${objname}: ${e.message}`);
        }
    }

    *compute(tlb: ArrayLike<number>, mem: SchemaMemory, schema: SchemaContextFunctions): ComputeResult {
        const model = this._func;
        let code = 0;
        while (true) {
            if ((code = model(code, this, tlb, mem, schema)) === 0) return;
            const r = this.getWaitResult();
            if (typeof r !== "object") {
                // Если это примитив, ничего не делаем, продолжаем выполнение.
                this.setWaitResult(r);
            } else if (r instanceof Promise) {
                // Если это промиз, то отдаем его наверх.
                yield r.then((res) => this.setWaitResult(res));
            } else {
                // Если это итератор (SendMessage или вызов функции), то выполняем его.
                this.setWaitResult(yield* r);
            }
        }
    }

    private contextVars: PossibleValue[] | null = null;
    saveContext(ctx: PossibleValue[]): void {
        if (this.contextVars !== null) throw Error("Попытка перезаписи контекстных переменных");
        this.contextVars = ctx;
    }
    loadContext(): PossibleValue[] {
        const c = this.contextVars;
        if (c === null) throw Error("Нет контекстных переменных");
        this.contextVars = null;
        return c;
    }

    private target: WaitingTarget | null = null;
    private setWaitResult(target: PossibleValue): void {
        if (this.target !== null) throw Error("Цель ожидания назначена");
        this.target = target;
    }
    waitFor(target: WaitingTarget): void {
        if (this.target !== null) throw Error("Цель ожидания назначена");
        this.target = target;
    }
    getWaitResult(): WaitingTarget {
        const r = this.target;
        if (r === null) throw Error("Нет результата ожидания");
        this.target = null;
        return r;
    }

    *call(schema: SchemaContextFunctions, fname: string, ...args: (string | number)[]): ComputeResult {
        const mod = this.lib.getModel(fname);
        if (!mod) {
            // return { f: `${schemaArg}.stubCall("${op.name}"${fargs.length > 0 ? "," + fargs : ""})` };
            schema.stubCall(fname, args);
            // throw Error(`Вызов несуществующего имиджа-функции ${fname}`);
        }
        if (!mod.isFunction) throw Error(`Имидж ${fname} не является функцией`);
        const memSize: MemorySize = {
            floatsCount: 0,
            intsCount: 0,
            stringsCount: 0,
        };
        const vars = mod.vars;

        const tlb = vars.map((v) => new VarGraphNode(v.type).getIndex(memSize));
        const oldFloats = new Float64Array(memSize.floatsCount);
        const oldInts = new Int32Array(memSize.intsCount);
        const oldStrings = new Array(memSize.stringsCount).fill("");

        if (args.length > vars.length) throw Error("Кол-во аргументов больше кол-ва переменных");
        for (let i = 0; i < args.length; ++i) {
            const val = args[i];
            const typ = vars[i].type;
            switch (typ) {
                case VarType.Float:
                    if (typeof val === "string") throw Error("Несовпадение типов");
                    oldFloats[tlb[i]] = val;
                    break;
                case VarType.Handle:
                case VarType.ColorRef:
                    if (typeof val === "string") throw Error("Несовпадение типов");
                    oldInts[tlb[i]] = val;
                    break;
                case VarType.String:
                    if (typeof val === "number") throw Error("Несовпадение типов");
                    oldStrings[tlb[i]] = val;
                    break;
            }
        }

        const mem: Partial<SchemaMemory> = {
            // newFloats: floats,
            oldFloats,
            // newInts: ints,
            oldInts,
            // newStrings: strings,
            oldStrings,
        };

        yield* mod.compute(tlb, mem as SchemaMemory, schema);

        const ret = vars.findIndex((v) => v.isReturnValue);
        if (ret < 0) {
            return;
        }
        const t = vars[ret].type;
        switch (t) {
            case VarType.String:
                return oldStrings[tlb[ret]];
            case VarType.Float:
                return oldFloats[tlb[ret]];
            default:
                return oldInts[tlb[ret]];
        }
    }
}

/**
 * Создает модель имиджа из исходного кода.
 * @param source Исходный код.
 * @param lib Библиотека имиджей-функций.
 * @param objname Идентификатор модели.
 * @param rawVars Информация о переменных (временно, позже надо убрать и генерировать переменные исходя из кода).
 * @returns Модель имиджа.
 */
export function translate(source: string, lib: ModelLibrary, objname: string, rawVars?: ReadonlyArray<VarInfo> | null): ClassModel {
    return new JsModel(source, lib, objname, rawVars);
}
