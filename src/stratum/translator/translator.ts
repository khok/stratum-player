import { ClassLibrary } from "stratum/common/classLibrary";
import { ClassModel, ClassVars } from "stratum/common/classProto";
import { VarType } from "stratum/common/varType";
import { Constant, Enviroment } from "stratum/env";
import { Project, Schema } from "stratum/project";
import { normalizeSource } from "./normalizer";
import { CallOperand, CodeLine, Expression, Operand, parse } from "./parser";
import { unreleasedFunctions } from "./unreleasedFunctions";

function noModel() {
    return 0;
}

const EXIT_CODE = 0;

const schemaArg = "schema";
const memArg = "mem";
const TLBArg = "TLB";
const retCodeArg = "retCode";

const prjVar: keyof Schema = "prj";
const envVar: keyof Project = "env";
const getTimeFunc: keyof Enviroment = "getTime";
const getDateFunc: keyof Enviroment = "getDate";
const getActualSize2dFunc: keyof Enviroment = "getActualSize2d";

function extract<T extends Function>(f: T, varName: string): [string, string][] {
    const PREFIX = "stratum_";
    const PREF_LEN = PREFIX.length;
    const funcs = (Object.getOwnPropertyNames(f.prototype) as (keyof T)[]).filter((c) => {
        const v = f.prototype[c];
        return typeof v === "function" && v.name.startsWith(PREFIX);
    });
    return funcs.map((c) => [c.toString().substring(PREF_LEN).toUpperCase(), `${varName}.${c}`]);
}

const funcTable = new Map([
    ["ADDSLASH", "addSlash"],
    ["ARCCOS", "arccos"],
    ["ARCSIN", "arcsin"],
    ["COMPAREI", "compareI"],
    ["GETANGLEBYXY", "getAngleByXY"],
    ["LG", "lg"],
    ["LN", "ln"],
    ["LOG", "log"],
    ["POS", "pos"],
    ["RIGHT", "right"],
    ["ROUND", "round"],
    ...extract(Enviroment, envVar),
    ...extract(Project, prjVar),
    ...extract(Schema, schemaArg),
]);

const arrNames = new Map([
    [VarType.Float, "F"],
    [VarType.Handle, "I"],
    [VarType.ColorRef, "I"],
    [VarType.String, "S"],
]);

const header = `
// if(schema.handle === 25) throw Error();
function addSlash(a) {
    return a[a.length - 1] === "\\\\" ? a : a + "\\\\";
}
function arccos(a) {
    if(a > 1) return 0;
    if(a < -1) return Math.PI;
    return Math.acos(a)||0;
}
function arcsin(a) {
    if(a > 1) return Math.PI / 2;
    if(a < -1) return -Math.PI / 2;
    return Math.asin(a)||0;
}
function compareI(s1, s2, n) {
    return s1.substring(0, n) === s2.substring(0, n);
}
function getAngleByXY(x, y) {
    if (y === 0) return x >= 0 ? 0 : Math.PI;
    if (y > 0) return -Math.atan(x / y) + Math.PI / 2;
    return -Math.atan(x / y) + Math.PI * 1.5;
}
function lg(a) {
    return a > 0 ? (Math.log(a)||0)/Math.LN10 : -(10**100)
}
function ln(a) {
    return a > 0 ? Math.log(a)||0 : -(10**100)
}
function log(a, b) {
    return a > 0 && b > 0 ? (Math.log(b)/Math.log(a))||0 : -(10**100)
}
function pos(s1, s2, n) {
    if(s2 === "") return -1
    var idx = -1;
    var srch = 0;
    for(var i = 0; i < n; ++i) {
        idx = s1.indexOf(s2, srch);
        if(idx < 0) return -1;
        srch = idx + s2.length;
    }
    return idx;
}
function right(a, n) {
    return a.substring(a.length - n);
}
function round(a, b) {
    var pw = Math.ceil(10 ** b);
    return (Math.round(a * pw + Number.EPSILON) / pw)||0;
}
var ${prjVar} = ${schemaArg}.${prjVar};
var ${envVar} = ${prjVar}.${envVar};
var oldF = ${memArg}.oldFloats;
var newF = ${memArg}.newFloats;
var oldI = ${memArg}.oldInts;
var newI = ${memArg}.newInts;
var oldS = ${memArg}.oldStrings;
var newS = ${memArg}.newStrings;
`;

class ExprParser {
    private varCounter = 0;
    private _hasBug = false;

    constructor(private res: string[], private vars: ClassVars, private lib: ClassLibrary, readonly missingFuncs: Map<string, string>) {}

    reset(): this {
        this.varCounter = 0;
        return this;
    }

    hasBug() {
        return this._hasBug;
    }

    private parseConst(val: string): string {
        if (val.length === 0) throw Error("Не удалось распарсить значение константы");
        //handle
        if (val[0] === "#") return val.length > 1 ? val.substring(1, val.length) : "0";
        //string
        if (val[0] === '"' || val[0] === "'") {
            const r = val
                .substring(1, val.length - 1)
                .split("\\")
                .join("\\\\")
                .split("`")
                .join("\\`");
            return "`" + r + "`";
        }
        //float
        return val;
    }

    private dereferCallArgs(args: Expression[]): [string, string][] {
        const floatArr = arrNames.get(VarType.Float);
        return args.map((a) => {
            if (a.first.type !== "var" || a.rest.length > 0) throw Error("Должно быть имя переменной");

            const nm = a.first.name;
            const id = this.vars.nameUCToId.get(nm.toUpperCase());
            if (id === undefined) throw Error(`Неопределенная переменная: ${nm}`);
            const typ = this.vars.types[id];
            if (typ !== VarType.Float) throw Error("Должна быть переменная типа float");
            return [`${a.first.isNew ? "new" : "old"}${floatArr}`, `${TLBArg}[${id}]`];
        });
    }

    private parseOperand(op: Operand): string {
        if (op.isNew && op.type !== "var") this._hasBug = true;

        switch (op.type) {
            case "const":
                return this.parseConst(op.value);
            case "var": {
                const nameUC: string = op.name.toUpperCase();
                const id = this.vars.nameUCToId.get(nameUC);
                if (id === undefined) {
                    const constValue = Constant[nameUC as keyof typeof Constant];
                    if (typeof constValue === "undefined") throw Error(`Неопределенная переменная или константа: ${op.name}`);
                    return constValue.toString();
                }
                const typ = arrNames.get(this.vars.types[id]);
                if (!typ) throw Error(`Неизвестный тип переменной ${op.name}`);

                return `${op.isNew ? "new" : "old"}${typ}[${TLBArg}[${id}]]`;
            }
            case "call":
                return this.put(this.parseCall(op));
            case "-":
                return `(-${this.parseOperand(op.op)})`;
            case "!":
                return `(!${this.parseOperand(op.op)})`;
            case "subexpr":
                return `(${this.parseExpr(op.expr)})`;
        }
    }

    private put(arg: string): string {
        const name = `t${++this.varCounter}`;
        this.res.push(`var ${name}=${arg};`);
        return name;
    }

    parseCall(op: CallOperand): string {
        const nameUC = op.name.toUpperCase();
        if (nameUC === "EXIT") return `return ${EXIT_CODE}`;

        // Функции, возвращающие значение "по ссылке".
        if (nameUC === "INC" || nameUC === "DEC") {
            const to = this.dereferCallArgs([op.args[0]])[0];
            const arg = op.args.length < 2 ? 1 : this.parseExpr(op.args[1]);
            return `${to[0]}[${to[1]}]${nameUC === "INC" ? "+" : "-"}=${arg}`;
        }
        if (nameUC === "GETTIME") {
            const a = this.dereferCallArgs(op.args);
            return `${envVar}.${getTimeFunc}(${a})`;
        }
        if (nameUC === "GETDATE") {
            const a = this.dereferCallArgs(op.args);
            return `${envVar}.${getDateFunc}(${a})`;
        }
        if (nameUC === "GETACTUALSIZE2D") {
            const f1 = op.args.slice(0, 2).map((a) => this.parseExpr(a));
            const f2 = this.dereferCallArgs(op.args.slice(2, 4));
            return `${envVar}.${getActualSize2dFunc}(${f1},${f2})`;
        }

        const fargs = op.args.map((a) => this.parseExpr(a));
        // Функции нельзя инлайнить т.к. Short-circuit evaluation не работает.
        if (nameUC === "FLOAT") return `parseFloat(${fargs[0]})||0`;
        if (nameUC === "HANDLE") return `parseInt(${fargs[0]})||0`;
        if (nameUC === "STRING") return `(Math.round((${fargs[0]})*100000)/100000).toString()`;

        if (nameUC === "ABS") return `Math.abs(${fargs[0]})||0`;
        if (nameUC === "AVERAGE") return `(${fargs[0]})/2+(${fargs[1]})/2`;
        if (nameUC === "EXP") return `Math.exp(${fargs[0]})||0`;
        if (nameUC === "MAX") return `Math.max(${fargs[0]}, ${fargs[1]})||0`;
        if (nameUC === "MIN") return `Math.min(${fargs[0]}, ${fargs[1]})||0`;
        if (nameUC === "LIMIT") return `Math.max(${fargs[1]}, Math.min(${fargs[2]}, ${fargs[0]}))||0`; //порядок аргументов?
        if (nameUC === "SQR") return `(${fargs[0]})**2`;
        if (nameUC === "SQRT") return `Math.sqrt(${fargs[0]})||0`;
        if (nameUC === "TRUNC") return `Math.trunc(${fargs[0]})||0`; //FIXME: нет в IE
        if (nameUC === "RND") return `(${fargs[0]})*Math.random()`;

        if (nameUC === "ARCTAN") return `Math.atan(${fargs[0]})||0`;
        if (nameUC === "COS") return `Math.cos(${fargs[0]})||0`;
        if (nameUC === "SIN") return `Math.sin(${fargs[0]})||0`;
        if (nameUC === "TAN") return `Math.tan(${fargs[0]})||0`;
        if (nameUC === "DEG") return `180*(${fargs[0]})/Math.PI||0`;
        if (nameUC === "RAD") return `Math.PI*(${fargs[0]})/180||0`;

        if (nameUC === "AND") return `(${fargs[0]})&&(${fargs[1]})`;
        if (nameUC === "DELTA") return `(${fargs[0]})?0:1`;
        if (nameUC === "ED") return `(${fargs[0]})>0?1:0`;
        if (nameUC === "NOT") return `!(${fargs[0]})`;
        if (nameUC === "NOTBIN") {
            console.warn("NOTBIN возвращает то же число из-за бага"); // VMACHINE.CPP:631
            return fargs[0];
        }
        if (nameUC === "OR") return `(${fargs[0]})||(${fargs[1]})`;
        if (nameUC === "SGN") return `Math.sign(${fargs[0]})||0`; //FIXME: нет в IE
        if (nameUC === "XOR") return `(${fargs[0]})!==0^(${fargs[1]})!==0`;
        if (nameUC === "XORBIN") return `(${fargs[0]})^(${fargs[1]})`;

        if (nameUC === "ALLTRIM") return `(${fargs[0]}).trim()`;
        if (nameUC === "CHANGE") return `(${fargs[0]}).replace(new RegExp(${fargs[1]}, "g"), ${fargs[2]})`;
        if (nameUC === "COMPARE") return `(${fargs[0]})===(${fargs[1]})`;
        if (nameUC === "LEFT") return `(${fargs[0]}).substring(0,${fargs[1]})`;
        if (nameUC === "LENGTH") return `(${fargs[0]}).length`;
        if (nameUC === "LOWER") return `(${fargs[0]}).toLowerCase()`;
        if (nameUC === "LTRIM") return `(${fargs[0]}).replace(/^\\s+/,"")`;
        if (nameUC === "REPLICATE") return `(${fargs[0]}).repeat(${fargs[1]})`; //FIXME: нет в IE
        if (nameUC === "SUBSTR") return `(${fargs[0]}).substr(${fargs[1]},${fargs[2]})`; //FIXME: substr лучше не использовать.
        if (nameUC === "RTRIM") return `(${fargs[0]}).replace(/\\s+$/,"")`;
        if (nameUC === "UPPER") return `(${fargs[0]}).toUpperCase()`;

        const fname = funcTable.get(nameUC);
        if (fname) {
            return `${fname}(${fargs})`;
        }
        if ((this.lib.get(nameUC)?.flags() ?? 0) & 1024) {
            return `${envVar}.callFunction("${nameUC}", ${schemaArg}${fargs.length > 0 ? "," + fargs : ""});`;
        }
        this.missingFuncs.set(nameUC, op.name);
        return `${schemaArg}.stubCall("${op.name}", ${fargs})`;
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
    lastBlock(): Block | undefined {
        return this.bblocks.length > 0 ? this.bblocks[this.bblocks.length - 1] : undefined;
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

class Translator {
    private _hasEquals = false;
    private _hasBug = false;
    private _hasFunc = false;
    private labelCnt = 0;

    readonly missingFuncs = new Map<string, string>();

    private res: string[] = [];
    private b = new BlockControl();

    constructor(private lib: ClassLibrary, private vars: ClassVars) {}

    private comment(comm: string) {
        this.res.push("//" + comm);
    }

    private parseCodeline(c: CodeLine, p: ExprParser): void {
        switch (c.type) {
            case ":=": {
                const id = this.vars.nameUCToId.get(c.to.toUpperCase());
                if (id === undefined) throw Error(`Неизвестная переменная: ${c.to}`);
                const typ = arrNames.get(this.vars.types[id]);
                if (!typ) throw Error(`Неизвестный тип переменной: ${this.vars.types[id]} ${c.to}`);

                this.res.push(`new${typ}[${TLBArg}[${id}]] = ${p.parseExpr(c.expr)};`);
                break;
            }
            case "callChain": {
                const p = new ExprParser(this.res, this.vars, this.lib, this.missingFuncs);
                this.res.push(c.functions.map((f) => p.parseCall(f)).join(";") + ";");
                break;
            }

            case "if": {
                this.comment("if");
                const b = this.b.pushBlock<LabelIf>({ canBreak: false, end: ++this.labelCnt, expect: "endif", haveElse: false });
                this.res.push(`if(!(${p.parseExpr(c.expr)})) return ${b.end};`);
                break;
            }
            case "else": {
                const b = this.b.lastBlock();
                // Защита от повторного else
                if (!b || b.expect !== "endif" || b.haveElse) throw Error("else должен находиться после if");
                b.haveElse = true;

                const els = b.end;
                b.end = ++this.labelCnt;

                this.res.push(`return ${b.end};`);
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
                this.res.push(`if(!(${p.parseExpr(c.expr)})) return ${block.end};`);
                break;
            }
            case "endwhile": {
                const b = this.b.popBlock<LabelWhile>("endwhile");
                this.res.push(`return ${b.start};`);
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
                this.res.push(`if(${p.parseExpr(c.expr)}) return ${b.start};`);
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
                    this.res.push(`return ${b.end};`);
                    this.comment("case");
                    this.res.push(`case ${b.next}:`);
                } else {
                    this.comment("case");
                }
                b.next = ++this.labelCnt;
                this.res.push(`if(!(${p.parseExpr(c.expr)})) return ${b.next};`);
                break;
            }
            case "default": {
                const b = this.b.lastBlock();
                if (!b || b.expect !== "endswitch") throw Error("default должен находиться внутри блока switch");
                if (!b.hasCase) throw Error("Ожидалось case");
                if (b.next !== null) {
                    this.res.push(`return ${b.end};`);
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
                this.res.push(`return ${this.b.getBreakID()};`);
                break;
            case "varsDec":
                return undefined;
            case "function":
                this._hasFunc = true;
                return undefined;
            case "return": {
                return undefined;
                // if (!vars) throw Error("Имидж не имеет переменных");
                // const id = vars.nameUCToId.get(c.to.toUpperCase());
                // if (id === undefined) throw Error(`Неизвестная переменная: ${c.to}`);
                // const typ = arrNames.get(vars.types[id]);
                // if (!typ) throw Error(`Неизвестный тип переменной: ${vars.types[id]} ${c.to}`);
                // return `return new${typ}[TLB[${id}]]`;
            }
            // if(!c.modifiers.some(c => c.toUpperCase() === "PARAMETER")) return undefined;
            // c.names.
            case "=":
                this._hasEquals = true;
                return undefined;
            default:
                throw Error(`Неизвестный оператор: ${c.type}`);
        }
    }

    translate(data: CodeLine[]) {
        this.res = [`switch(${retCodeArg}) {`, "case 0:"];
        const p = new ExprParser(this.res, this.vars, this.lib, this.missingFuncs);

        for (let i = 0; i < data.length; ++i) {
            try {
                const cd = data[i];
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
        this.res.push("}", `return ${EXIT_CODE};`);
        return this.res;
    }

    hasEquations() {
        return this._hasEquals;
    }

    isFunction() {
        return this._hasFunc;
    }

    hasBug() {
        return this._hasBug;
    }
}

export function translate(source: string, vars: ClassVars, objname: string, lib: ClassLibrary): ClassModel {
    const norm = normalizeSource(source);

    let data: CodeLine[];
    try {
        data = parse(norm);
    } catch (e) {
        console.dir(e);
        console.log(norm);
        const st = e.location.start;
        throw Error(`Ошибка парсинга ${objname}, строка ${st.line} столбец ${st.column}: ${e.message}`);
    }
    if (data.length === 0) return { isFunction: false, model: noModel };

    const t = new Translator(lib, vars);
    let res: string[];
    try {
        res = t.translate(data);
    } catch (e) {
        // prettier-ignore
        console.log(norm.split("\n").filter(s => s.trim()).map((s, idx) => `${idx + 1}: ${s}`).join("\n"));
        throw Error(`Ошибка трансляции ${objname}: ${e.message}`);
    }

    if (t.hasEquations()) console.warn(`Уравнения в ${objname} не реализованы`);
    if (t.hasBug()) console.warn(`${objname}: игнорируется применение оператора '~' к не переменной`);
    if (res.length === 0) return { isFunction: t.isFunction(), model: noModel };

    const funcs = t.missingFuncs;
    if (funcs.size > 0) console.warn(`Функции ${[...funcs.values()].join(", ")} в ${objname} не реализованы.`);
    funcs.forEach((v, k) => unreleasedFunctions.set(k, v));

    const body = res.join("\n");
    console.log(`Компилируем ${objname}`);

    let model: ClassModel["model"];
    try {
        model = new Function(schemaArg, TLBArg, memArg, retCodeArg, header + body + `//# sourceURL=${objname}`) as ClassModel["model"];
    } catch (e) {
        // prettier-ignore
        console.log(norm.split("\n").filter(s => s.trim()).map((s, idx) => `${idx + 1}: ${s}`).join("\n"));
        console.log(body);
        throw Error(`Ошибка eval ${objname}: ${e.message}`);
    }
    return { model, isFunction: t.isFunction() };
}
