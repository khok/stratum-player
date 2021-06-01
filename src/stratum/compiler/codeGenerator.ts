import { Constant } from "stratum/common/constant";
import { VarType } from "stratum/common/varType";
import {
    callFunc,
    envVar,
    EXIT_CODE,
    getActualSize2dFunc,
    getDateFunc,
    getMousePosFunc,
    getTimeFunc,
    getVarInfoFunc,
    getWaitResultFunc,
    loadContextFunc,
    memArg,
    modelArg,
    nf,
    ni,
    ns,
    of,
    oi,
    os,
    prjVar,
    retCodeArg,
    saveContextFunc,
    schemaArg,
    TLBArg,
    waitForFunc,
} from "./compilerConsts";
import { ModelLibrary, VarInfo } from "./compilerTypes";
import { FuncInfo, funcTable } from "./functionTable";
import { CallOperand, CodeLine, Expression, Operand } from "./parser";

const newPr = "n";
const oldPr = "o";
const arrNames: string[] = [];
arrNames[VarType.Float] = "F";
arrNames[VarType.Handle] = "I";
arrNames[VarType.ColorRef] = "I";
arrNames[VarType.String] = "S";

export const schemaHeader = `
var ${prjVar} = ${schemaArg}.${prjVar};
var ${envVar} = ${prjVar}.${envVar};
var ${oldPr}${arrNames[VarType.Float]} = ${memArg}.${of};
var ${newPr}${arrNames[VarType.Float]} = ${memArg}.${nf};
var ${oldPr}${arrNames[VarType.Handle]} = ${memArg}.${oi};
var ${newPr}${arrNames[VarType.Handle]} = ${memArg}.${ni};
var ${oldPr}${arrNames[VarType.String]} = ${memArg}.${os};
var ${newPr}${arrNames[VarType.String]} = ${memArg}.${ns};
`;

export const funcHeader = `
var ${prjVar} = ${schemaArg}.${prjVar};
var ${envVar} = ${prjVar}.${envVar};
var ${oldPr}${arrNames[VarType.Float]} = ${memArg}.${of};
var ${newPr}${arrNames[VarType.Float]} = ${memArg}.${of};
var ${oldPr}${arrNames[VarType.Handle]} = ${memArg}.${oi};
var ${newPr}${arrNames[VarType.Handle]} = ${memArg}.${oi};
var ${oldPr}${arrNames[VarType.String]} = ${memArg}.${os};
var ${newPr}${arrNames[VarType.String]} = ${memArg}.${os};
`;

function insertBreak(res: string[], v: string, popResult: boolean) {
    const cnt = res.length;
    const r = `${modelArg}.${getWaitResultFunc}();`;
    res.push(`${modelArg}.${waitForFunc}(${v});`, `return -${cnt};`, `case -${cnt}:`, popResult ? `var ${v} = ${r}` : r);
}

class VarSearch {
    get(vname: string): [VarInfo, number] | undefined {
        return this.v.get(vname.toUpperCase());
    }
    private v: Map<string, [VarInfo, number]>;
    constructor(rawVars?: ReadonlyArray<VarInfo> | null) {
        this.v = new Map(rawVars?.map((v, i) => [v.name.toUpperCase(), [v, i]]));
    }
    result(): VarInfo[] {
        return [...this.v.values()].map((v) => v[0]);
    }
}

class ExprGenerator {
    private varCount = 0;
    private _hasBug = false;
    constructor(
        private res: string[],
        private vars: VarSearch,
        private lib: ModelLibrary,
        private missingFuncs: Map<string, string>,
        private innerFuncs: Set<string>
    ) {}

    reset(): this {
        this.varCount = 0;
        return this;
    }

    hasBug() {
        return this._hasBug;
    }

    arr(isNew: boolean, vname: string) {
        const info = this.vars.get(vname);
        if (!info) throw Error(`Неизвестная переменная: ${vname}`);
        const typ = arrNames[info[0].type];
        return `${isNew ? newPr : oldPr}${typ}[${TLBArg}[${info[1]}]]`;
    }

    derefer(e: Expression): [string, string] {
        if (e.first.type !== "var" || e.rest.length > 0) throw Error("Должно быть имя переменной");

        const vname = e.first.name;
        const info = this.vars.get(vname);
        if (!info) throw Error(`Неизвестная переменная: ${vname}`);
        // if (info[0].type !== VarType.Float) throw Error(`Ожидалась переменная типа Float`);
        // return [`${e.first.isNew ? newPr : oldPr}${arrNames[VarType.Float]}`, `${TLBArg}[${info[1]}]`];
        return [`${e.first.isNew ? newPr : oldPr}${arrNames[info[0].type]}`, `${TLBArg}[${info[1]}]`];
    }

    private parseOperand(op: Operand): string {
        if (op.isNew && op.type !== "var") this._hasBug = true;

        switch (op.type) {
            case "float":
            case "handle":
                return op.value.toString();
            case "string":
                return "`" + op.value.split("\\").join("\\\\").split("`").join("\\`") + "`";
            case "var": {
                const nameUC = op.name.toUpperCase();
                return Constant[nameUC as keyof typeof Constant]?.toString() ?? this.arr(op.isNew, nameUC);
            }
            case "call": {
                const r = this.parseCall(op);

                const v = this.put(r.f);
                if (r.blocking) {
                    const savedVars: string[] = Array.from({ length: this.varCount - 1 }, (_, i) => `t${i}`);
                    if (savedVars.length > 0) {
                        this.res.push(`${modelArg}.${saveContextFunc}([${savedVars.join(",")}]);`);
                    }
                    insertBreak(this.res, v, true);
                    if (savedVars.length > 0) {
                        const unblock = `var ctx = ${modelArg}.${loadContextFunc}();`;
                        const load = savedVars.map((n, i) => `var ${n}=ctx[${i}];`).join("");
                        this.res.push(unblock, load);
                    }
                }
                return v;
            }
            case "-":
                return `(-${this.parseOperand(op.op)})`;
            case "!":
                return `(!${this.parseOperand(op.op)})`;
            case "subexpr":
                return `(${this.parseExpr(op.expr)})`;
        }
    }

    private put(arg: string): string {
        const name = `t${this.varCount++}`;
        this.res.push(`var ${name}=${arg};`);
        return name;
    }

    parseCall(op: CallOperand): FuncInfo {
        const nameUC = op.name.toUpperCase();

        const fargs = op.args.map((a) => this.parseExpr(a));

        // Функции нельзя инлайнить т.к. Short-circuit evaluation не работает.
        const data = funcTable.get(nameUC);
        if (data) {
            if (data.inline !== "template") {
                if (data.inline === "inner") this.innerFuncs.add(data.f);
                return { ...data, f: `${data.f}(${fargs})` };
            }

            // Шаблонная функция
            let result = data.f;
            let i = 0;
            while (i < fargs.length) {
                const n = result.replace(`#${i}`, fargs[i]);
                if (result === n) {
                    throw Error(`Слишком много аргументов в функции ${op.name}: ${fargs.length}, максимум - ${i})`);
                }
                result = n;
                ++i;
            }
            let next = result;
            while ((next = result.replace(`#${i}`, "undefined")) !== result) {
                result = next;
                ++i;
            }
            return { ...data, f: result };
        }

        // Функции, возвращающие значение "по ссылке".
        if (nameUC === "INC" || nameUC === "DEC") {
            const to = this.derefer(op.args[0]);
            const arg = op.args.length < 2 ? 1 : this.parseExpr(op.args[1]);
            return { f: `${to[0]}[${to[1]}]${nameUC === "INC" ? "+" : "-"}=${arg}` };
        }
        if (nameUC === "GETTIME") {
            const a = op.args.map((a) => this.derefer(a));
            return { f: `${envVar}.${getTimeFunc}(${a})` };
        }
        if (nameUC === "GETDATE") {
            const a = op.args.map((a) => this.derefer(a));
            return { f: `${envVar}.${getDateFunc}(${a})` };
        }
        if (nameUC === "GETACTUALSIZE2D") {
            const f1 = op.args.slice(0, 2).map((a) => this.parseExpr(a));
            const f2 = op.args.slice(2).map((a) => this.derefer(a));
            return { f: `${envVar}.${getActualSize2dFunc}(${f1},${f2})` };
        }
        if (nameUC === "GETVARINFO") {
            const f1 = op.args.slice(0, 2).map((a) => this.parseExpr(a));
            const f2 = op.args.slice(2).map((a) => this.derefer(a));
            return { f: `${envVar}.${getVarInfoFunc}(${f1},${f2})` };
        }
        if (nameUC === "GETMOUSEPOS") {
            const a1 = this.parseExpr(op.args[0]);
            const a2 = this.derefer(op.args[1]);
            const a3 = this.derefer(op.args[2]);
            return { f: `${envVar}.${getMousePosFunc}(${a1},${a2},${a3})` };
        }
        if (nameUC === "RANDOMIZE") {
            return { f: "" };
        }

        // Вызов функции.
        const r = this.lib.getModel(op.name);
        if (!r) {
            // имидж, скорее всего, не существует, однако, он может быть загружен позже.
            // Либо же это нереализованная функция.
            this.missingFuncs.set(nameUC, op.name);
        } else if (!r.isFunction) {
            // throw Error(`Имидж ${op.name} не является функцией`);
        }
        return { f: `${modelArg}.${callFunc}(${schemaArg}, "${op.name}"${fargs.length > 0 ? "," + fargs : ""})`, blocking: true };
    }

    parseExpr(expr: Expression): string {
        const f = this.parseOperand(expr.first);
        const r = expr.rest.map((exp) => {
            if (exp.action === "/") {
                return `/(${this.parseOperand(exp.operand)} || Infinity)`;
            }
            return exp.action + this.parseOperand(exp.operand);
        });
        return f + r.join("");
    }
}

interface LabelWhile {
    expect: "endwhile";
    canBreak: true;
    end: number;
    start: number;
}
interface LabelDoUntil {
    expect: "until";
    canBreak: true;
    end: number;
    start: number;
}
interface LabelSwitch {
    expect: "endswitch";
    canBreak: true;
    end: number;
    next: number | null;
    hasCase: boolean;
}

interface LabelIf {
    expect: "endif";
    haveElse: boolean;
    canBreak: false;
    end: number;
}

type Block = LabelIf | LabelWhile | LabelDoUntil | LabelSwitch;

class BlockControl {
    private readonly bblocks: Block[] = [];

    pushBlock<T extends Block>(block: T): T {
        this.bblocks.push(block);
        return block;
    }
    popBlock<T extends Block>(expect: T["expect"]): T {
        const b = this.bblocks.pop();
        if (!b || b.expect !== expect) throw Error(`Ожидалось ${expect}`);
        return b as T;
    }
    lastBlock(): Block | null {
        return this.bblocks.length > 0 ? this.bblocks[this.bblocks.length - 1] : null;
    }
    getBreakID(): number {
        for (let i = this.bblocks.length - 1; i >= 0; --i) {
            const b = this.bblocks[i];
            if (b.canBreak) return b.end;
        }
        // throw Error("break должен быть внутри switch/while/do-until");
        return EXIT_CODE;
    }
}

export class CodeGenerator {
    private _hasEquals = false;
    private _hasBug = false;
    private _hasFuncDecl = false;
    private labelCnt = 0;

    readonly missingFuncs = new Map<string, string>();

    private res: string[] = [];
    private b = new BlockControl();
    private readonly innerFuncs = new Set<string>();

    private _vars: VarSearch;

    constructor(ast: CodeLine[], private lib: ModelLibrary, rawVars?: ReadonlyArray<VarInfo> | null) {
        this._vars = new VarSearch(rawVars);

        this.res = [`var code = ${retCodeArg};`, "while(true) {", "switch(code) {", "case 0:"];
        const p = new ExprGenerator(this.res, this._vars, this.lib, this.missingFuncs, this.innerFuncs);

        for (let i = 0; i < ast.length; ++i) {
            try {
                const cd = ast[i];
                this.parseCodeline(cd, p.reset());

                let th = cd.then;
                while (th) {
                    this.parseCodeline(th, p.reset());
                    th = th.then;
                }
            } catch (e) {
                throw Error(e.message + " в строке " + (i + 1));
            }
        }
        this._hasBug = p.hasBug();

        const b = this.b.lastBlock();
        if (b) throw Error(`Ожидалось ${b.expect}`);
        this.res.push("}", `return ${EXIT_CODE};`, "}");
    }

    private comment(comm: string) {
        this.res.push("//" + comm);
    }

    private makeJump(id: number): string {
        return `{ code = ${id}; continue; }`;
    }

    private parseCodeline(c: CodeLine, p: ExprGenerator): void {
        switch (c.type) {
            case ":=": {
                this.res.push(`${p.arr(true, c.to)} = ${p.parseExpr(c.expr)};`);
                break;
            }
            case "callChain": {
                for (let i = 0; i < c.functions.length; ++i) {
                    const f = c.functions[i];
                    const r = p.reset().parseCall(f);
                    if (r.blocking) {
                        insertBreak(this.res, r.f, false);
                    } else {
                        this.res.push(`${r.f};`);
                    }
                }
                break;
            }

            case "if": {
                this.comment("if");
                const b = this.b.pushBlock<LabelIf>({ canBreak: false, end: ++this.labelCnt, expect: "endif", haveElse: false });
                this.res.push(`if(!(${p.parseExpr(c.expr)})) ${this.makeJump(b.end)}`);
                break;
            }
            case "else": {
                const b = this.b.lastBlock();
                // Защита от повторного else
                if (!b || b.expect !== "endif" || b.haveElse) throw Error("else должен находиться после if");
                b.haveElse = true;

                const els = b.end;
                b.end = ++this.labelCnt;

                this.res.push(this.makeJump(b.end));
                this.comment("else");
                this.res.push(`case ${els}:`);
                break;
            }
            case "endif": {
                this.comment("endif");
                this.res.push(`case ${this.b.popBlock<LabelIf>("endif").end}:`);
                break;
            }

            case "while": {
                this.comment("while");
                const block = this.b.pushBlock<LabelWhile>({ expect: "endwhile", start: ++this.labelCnt, end: ++this.labelCnt, canBreak: true });
                this.res.push(`case ${block.start}:`);
                this.res.push(`if(!(${p.parseExpr(c.expr)})) ${this.makeJump(block.end)}`);
                break;
            }
            case "endwhile": {
                const b = this.b.popBlock<LabelWhile>("endwhile");
                this.res.push(this.makeJump(b.start));
                this.comment("endwhile");
                this.res.push(`case ${b.end}:`);
                break;
            }

            case "do": {
                this.comment("do");
                const block = this.b.pushBlock<LabelDoUntil>({ expect: "until", start: ++this.labelCnt, end: ++this.labelCnt, canBreak: true });
                this.res.push(`case ${block.start}:`);
                break;
            }
            case "until": {
                const b = this.b.popBlock<LabelDoUntil>("until");
                this.res.push(`if(${p.parseExpr(c.expr)}) ${this.makeJump(b.start)}`);
                this.comment("until");
                this.res.push(`case ${b.end}:`);
                break;
            }

            case "switch": {
                this.comment("switch");
                this.b.pushBlock<LabelSwitch>({ expect: "endswitch", end: ++this.labelCnt, next: null, canBreak: true, hasCase: false });
                break;
            }
            case "endswitch": {
                this.comment("endswitch");
                const b = this.b.popBlock<LabelSwitch>("endswitch");
                if (b.next !== null) this.res.push(`case ${b.next}:`);
                this.res.push(`case ${b.end}:`);
                break;
            }
            case "case": {
                const b = this.b.lastBlock();
                if (!b || b.expect !== "endswitch") throw Error("case должен находиться внутри блока switch");
                b.hasCase = true;
                if (b.next !== null) {
                    this.res.push(this.makeJump(b.end));
                    this.comment("case");
                    this.res.push(`case ${b.next}:`);
                } else {
                    this.comment("case");
                }
                b.next = ++this.labelCnt;
                this.res.push(`if(!(${p.parseExpr(c.expr)})) ${this.makeJump(b.next)}`);
                break;
            }
            case "default": {
                const b = this.b.lastBlock();
                if (!b || b.expect !== "endswitch") throw Error("default должен находиться внутри блока switch");
                if (!b.hasCase) throw Error("Ожидалось case");
                if (b.next !== null) {
                    this.res.push(this.makeJump(b.end));
                    this.comment("default");
                    this.res.push(`case ${b.next}:`);
                } else {
                    this.comment("default");
                }
                b.next = null;
                break;
            }

            case "break":
                this.comment("break");
                const id = this.b.getBreakID();
                this.res.push(id === EXIT_CODE ? `return ${EXIT_CODE};` : this.makeJump(id));
                break;
            case "varsDec":
                break;
            case "function":
                this._hasFuncDecl = true;
                break;
            case "return": {
                break;
                // if (!vars) throw Error("Имидж не имеет переменных");
                // const id = vars.nameUCToId.get(c.to.toUpperCase());
                // if (id === undefined) throw Error(`Неизвестная переменная: ${c.to}`);
                // const typ = arrNames.get(vars.types[id]);
                // if (!typ) throw Error(`Неизвестный тип переменной: ${vars.types[id]} ${c.to}`);
                // return `return new${typ}[TLB[${id}]]`;
            }
            // if(!c.modifiers.some(c => c.toUpperCase() === "PARAMETER")) return null;
            // c.names.
            case "=":
                this._hasEquals = true;
                break;
            default:
                throw Error(`Неизвестный оператор: ${c.type}`);
        }
    }

    result(): ReadonlyArray<string> {
        return this.res;
    }
    vars(): ReadonlyArray<VarInfo> {
        return this._vars.result();
    }

    innerFunctions(): ReadonlyArray<string> {
        return [...this.innerFuncs];
    }

    hasEquations(): boolean {
        return this._hasEquals;
    }

    hasFunctionDecl(): boolean {
        return this._hasFuncDecl;
    }

    hasBug(): boolean {
        return this._hasBug;
    }
}
