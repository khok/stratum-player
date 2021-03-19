import { ClassLibrary } from "stratum/common/classLibrary";
import { ClassModel, ClassVars, FunctionModel } from "stratum/common/classProto";
import { VarType } from "stratum/common/varType";
import { Constant, Enviroment } from "stratum/env";
import { Project, Schema } from "stratum/project";
import { normalizeSource } from "./normalizer";
import { CodeLine, OP, Operand, parse } from "./parser";
import { unreleasedFunctions } from "./unreleasedFunctions";

function extract<T extends Function>(f: T, varName: string): [string, string][] {
    const PREFIX = "stratum_";
    const PREF_LEN = PREFIX.length;
    const funcs = (Object.getOwnPropertyNames(f.prototype) as (keyof T)[]).filter((c) => {
        const v = f.prototype[c];
        return typeof v === "function" && v.name.startsWith(PREFIX);
    });
    return funcs.map((c): [string, string] => [c.toString().substring(PREF_LEN).toUpperCase(), `${varName}.${c}`]);
}

const schemaVarName = "schema";
const prjVarName: keyof Schema = "prj";
const envVarName: keyof Project = "env";
const getTimeFunc: keyof Enviroment = "getTime";
const getDateFunc: keyof Enviroment = "getDate";
const getActualSize2dFunc: keyof Enviroment = "getActualSize2d";

const funcTable = new Map([
    ["ADDSLASH", "addSlash"],
    ["LN", "ln"],
    ["POS", "pos"],
    ["RIGHT", "right"],
    ["ROUND", "round"],
    ...extract(Enviroment, envVarName),
    ...extract(Project, prjVarName),
    ...extract(Schema, schemaVarName),
]);

const arrNames = new Map([
    [VarType.Float, "F"],
    [VarType.Handle, "I"],
    [VarType.ColorRef, "I"],
    [VarType.String, "S"],
]);
const TLBVarName: keyof Schema = "TLB";

const header = `
function addSlash(a) {
    return a[a.length - 1] === "\\\\" ? a : a + "\\\\";
}
function ln(a) {
    return a > 0 ? Math.log(a) : -(10**100)
}
function pos(s1, s2, n) {
    if(s2 === "") return -1
    let idx = -1;
    let srch = 0;
    for(let i = 0; i < n; ++i) {
        idx = s1.indexOf(s2, srch);
        if(idx < 0) return -1;
        srch = idx + s2.length;
    }
    return idx;
}
function right(a, n) {
    return a.substr(a.length - n);
}
function round(a, b) {
    const pw = Math.ceil(10 ** b);
    return Math.round(a * pw + Number.EPSILON) / pw;
}
var ${prjVarName} = ${schemaVarName}.${prjVarName};
var ${envVarName} = ${prjVarName}.${envVarName};
`;

const baseHeader = `
var ${TLBVarName} = ${schemaVarName}.${TLBVarName};
var oldF = ${prjVarName}.oldFloats;
var newF = ${prjVarName}.newFloats;
var oldI = ${prjVarName}.oldInts;
var newI = ${prjVarName}.newInts;
var oldS = ${prjVarName}.oldStrings;
var newS = ${prjVarName}.newStrings;
`;

const funcHeader = `
var oldF = floats;
var newF = floats;
var oldI = ints;
var newI = ints;
var oldS = strings;
var newS = strings;
`;

const funcParams = [TLBVarName, "floats", "ints", "strings"];

let _hasBug = false;
function subOpToString(subop: OP, vars: ClassVars | undefined, lib: ClassLibrary) {
    if (subop.isNew && subop.type !== "var") _hasBug = true;
    switch (subop.type) {
        case "const": {
            const val = subop.value;
            if (val[0] === "#") return val.length > 1 ? val.substring(1, val.length) : "0";
            if (val[0] === '"' || val[0] === "'") {
                const r = val
                    .substring(1, val.length - 1)
                    .split("\\")
                    .join("\\\\")
                    .split("`")
                    .join("\\`");
                return "`" + r + "`";
            }
            return val;
        }
        case "-":
            return "-" + opToString(subop.operand, vars, lib);
        case "!":
            return "!" + opToString(subop.operand, vars, lib);
        case "var": {
            if (!vars) throw Error("Имидж не имеет переменных");
            const nameUC: string = subop.name.toUpperCase();
            const id = vars.nameUCToId.get(nameUC);
            if (id === undefined) {
                const constValue = Constant[nameUC as keyof typeof Constant];
                if (constValue === undefined) throw Error(`Неопределенная переменная или константа: ${subop.name}`);
                return constValue;
            }
            const typ = arrNames.get(vars.types[id]);
            if (!typ) throw Error(`Неизвестный тип переменной ${subop.name}`);

            return `${subop.isNew ? "new" : "old"}${typ}[${TLBVarName}[${id}]]`;
        }
        case "call": {
            const nameUC = subop.name.toUpperCase();
            if (nameUC === "EXIT") return "return";

            if (nameUC === "INC") {
                const floatArr = arrNames.get(VarType.Float);
                if (!vars) throw Error("Имидж не имеет переменных");
                const a = subop.args[0];
                if (a.first.type !== "var") throw Error("Должно быть имя переменной");
                const nm = a.first.name;
                const id = vars.nameUCToId.get(nm.toUpperCase());
                if (id === undefined) throw Error(`Неопределенная переменная в функции Inc: ${nm}`);
                const arg = subop.args.length < 2 ? 1 : opToString(subop.args[1], vars, lib);
                return `${a.first.isNew ? "new" : "old"}${floatArr}[${TLBVarName}[${id}]] += ${arg}`;
            }

            if (nameUC === "GETTIME") {
                const floatArr = arrNames.get(VarType.Float);
                if (!vars) throw Error("Имидж не имеет переменных");
                const a = subop.args.map((a) => {
                    if (a.first.type !== "var") throw Error("Должно быть имя переменной");

                    const nm = a.first.name;
                    const id = vars.nameUCToId.get(nm.toUpperCase());
                    if (id === undefined) throw Error(`Неопределенная переменная в функции GetTime: ${nm}`);
                    return `${a.first.isNew ? "new" : "old"}${floatArr},${TLBVarName}[${id}]`;
                });
                return `${envVarName}.${getTimeFunc}(${a.join(",")})`;
            }

            if (nameUC === "GETDATE") {
                const floatArr = arrNames.get(VarType.Float);
                if (!vars) throw Error("Имидж не имеет переменных");
                const a = subop.args.map((a) => {
                    if (a.first.type !== "var") throw Error("Должно быть имя переменной");

                    const nm = a.first.name;
                    const id = vars.nameUCToId.get(nm.toUpperCase());
                    if (id === undefined) throw Error(`Неопределенная переменная в функции GetDate: ${nm}`);
                    return `${a.first.isNew ? "new" : "old"}${floatArr},${TLBVarName}[${id}]`;
                });
                return `${envVarName}.${getDateFunc}(${a.join(",")})`;
            }

            if (nameUC === "GETACTUALSIZE2D") {
                const floatArr = arrNames.get(VarType.Float);
                if (!vars) throw Error("Имидж не имеет переменных");

                const f1 = subop.args.slice(0, 2).map((a) => opToString(a, vars, lib));
                const f2 = subop.args.slice(2, 4).map((a) => {
                    if (a.first.type !== "var") throw Error("Должно быть имя переменной");

                    const nm = a.first.name;
                    const id = vars.nameUCToId.get(nm.toUpperCase());
                    if (id === undefined) throw Error(`Неопределенная переменная в функции GetActualSize2d: ${nm}`);
                    return `${a.first.isNew ? "new" : "old"}${floatArr},${TLBVarName}[${id}]`;
                });
                return `${envVarName}.${getActualSize2dFunc}(${f1.join(",")},${f2.join(",")})`;
            }

            const fargs = subop.args.map((a) => opToString(a, vars, lib));
            if (nameUC === "NOT") return `((${fargs[0]})>0===true?0:1)`;
            if (nameUC === "AND") return `(((${fargs[0]})>0&&(${fargs[1]})>0)===true?1:0)`;

            if (nameUC === "SQR") return `(${fargs[0]})**2`;

            if (nameUC === "ABS") return `(Math.abs(${fargs[0]})||0)`;
            if (nameUC === "TRUNC") return `(Math.trunc(${fargs[0]})||0)`;
            if (nameUC === "SQRT") return `(Math.sqrt(${fargs[0]})||0)`;
            if (nameUC === "SIN") return `(Math.sin(${fargs[0]})||0)`;
            if (nameUC === "COS") return `(Math.cos(${fargs[0]})||0)`;
            if (nameUC === "EXP") return `(Math.exp(${fargs[0]})||0)`;
            if (nameUC === "SGN") return `(Math.sign(${fargs[0]})||0)`;
            if (nameUC === "MIN") return `(Math.min(${fargs[0]}, ${fargs[1]})||0)`;
            if (nameUC === "MAX") return `(Math.max(${fargs[0]}, ${fargs[1]})||0)`;

            if (nameUC === "AVERAGE") return `((${fargs[0]})/2+(${fargs[1]})/2)`;

            if (nameUC === "HANDLE") return `(parseInt(${fargs[0]})||0)`;
            if (nameUC === "FLOAT") return `(parseFloat(${fargs[0]})||0)`;
            if (nameUC === "STRING") return `(Math.round((${fargs[0]})*100000)/100000).toString()`;

            if (nameUC === "LENGTH") return `(${fargs[0]}).length`;
            if (nameUC === "SUBSTR") return `(${fargs[0]}).substr(${fargs[1]},${fargs[2]})`;
            if (nameUC === "LEFT") return `(${fargs[0]}).substr(0,${fargs[1]})`;
            // if (nameUC === "RIGHT") return `right(${fargs[0]}, ${fargs[1]})`;
            if (nameUC === "RND") return `(Math.random() * (${fargs[0]}))`;
            if (nameUC === "CHANGE") return `(${fargs[0]}).replace(new RegExp(${fargs[1]}, "g"), ${fargs[2]})`;

            const strArg = fargs.join(",");
            const fname = funcTable.get(nameUC);
            if (fname) {
                return `${fname}(${strArg})`;
            }
            const cl = lib.get(nameUC)?.funcModel(lib);
            if (cl) {
                return `${envVarName}.callFunction("${nameUC}", ${schemaVarName}${fargs.length > 0 ? "," + fargs : ""})`;
            }
            funcs.set(nameUC, subop.name);
            fargs.unshift(`"${subop.name}"`);
            return `${schemaVarName}.stubCall(${strArg})`;
        }
        case "expression":
            return `(${opToString(subop.body, vars, lib)})`;
        default:
            console.log(subop);
            throw Error(`Неизвестный операнд: ${subop.type}`);
    }
}

function opToString(op: Operand, vars: ClassVars | undefined, lib: ClassLibrary): string {
    const f = subOpToString(op.first, vars, lib);
    const r = op.rest.map((exp) => {
        if (exp.action === "/") return `/(${subOpToString(exp.op, vars, lib)} || Infinity)`;
        return exp.action + subOpToString(exp.op, vars, lib);
    });
    return f + r.join("");
}

let _hasEquals = false;
function parseCodeline(c: CodeLine, vars: ClassVars | undefined, lib: ClassLibrary): string | undefined {
    switch (c.type) {
        case ":=": {
            if (!vars) throw Error("Имидж не имеет переменных");
            const id = vars.nameUCToId.get(c.to.toUpperCase());
            if (id === undefined) throw Error(`Неизвестная переменная: ${c.to}`);
            const typ = arrNames.get(vars.types[id]);
            if (!typ) throw Error(`Неизвестный тип переменной: ${vars.types[id]} ${c.to}`);
            return `new${typ}[TLB[${id}]] = ${opToString(c.operand, vars, lib)};`;
        }
        case "varsDec":
            return undefined;
        case "function":
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
            _hasEquals = true;
            return undefined;
        case "switch":
            return "do{let exc=false;{";
        case "case":
            return `}if ((${opToString(c.expr.body, vars, lib)})&&exc===false) {exc=true;`;
        case "default":
            return `}if (exc===false) {exc=true;`;
        case "endswitch":
            return `}}while(false);`;
        case "if":
        case "while":
            return `${c.type} (${opToString(c.expr.body, vars, lib)}) {`;
        case "endif":
        case "endwhile":
            return `}`;
        case "else":
            return `} else {`;
        case "do":
            return "do {";
        case "until":
            return `}\nwhile(${opToString(c.expr.body, vars, lib)});`;
        case "break":
            return "break;";
        case "callChain":
            return c.functions.map((f) => `${subOpToString(f, vars, lib)}`).join("; ") + ";";
        default:
            throw Error(`Неизвестный оператор: ${c.type}`);
    }
}

const funcs = new Map<string, string>();
function compileSource(source: string, vars: ClassVars | undefined, objname: string, lib: ClassLibrary, isFunc: boolean) {
    funcs.clear();
    const norm = normalizeSource(source);
    let data: CodeLine[];
    try {
        data = parse(norm);
    } catch (e) {
        console.log(norm);
        throw Error(`Ошибка парсинга ${objname}: ${e.message}`);
    }
    if (data.length === 0) return undefined;

    if (isFunc && data[0].type !== "function") {
        return undefined;
    }

    let body = "";
    _hasEquals = _hasBug = false;
    for (let i = 0; i < data.length; ++i) {
        try {
            const cd = data[i];
            {
                const line = parseCodeline(cd, vars, lib);
                if (line) body += line + "\n";
            }
            let th = cd.then;
            while (th) {
                const line = parseCodeline(th, vars, lib);
                if (line) body += line + "\n";
                th = th.then;
            }
        } catch (e) {
            // prettier-ignore
            console.log(norm.split("\n").filter(s => s.trim()).map((s, idx) => `${idx + 1}: ${s}`).join("\n"));
            throw Error(`Ошибка компиляции ${objname}: ${e.message} в строке ${i + 1}`);
        }
    }
    if (_hasEquals) console.warn(`Уравнения в ${objname} не реализованы`);
    if (_hasBug) console.warn(`${objname}: игнорируется применение оператора '~' к не переменной`);
    if (body.length === 0) return undefined;

    if (funcs.size > 0) console.warn(`Функции ${[...funcs.values()].join(", ")} в ${objname} не реализованы.`);
    funcs.forEach((v, k) => unreleasedFunctions.set(k, v));
    return { body, norm };
}

export function translate(source: string, vars: ClassVars | undefined, objname: string, lib: ClassLibrary): ClassModel | undefined {
    const res = compileSource(source, vars, objname, lib, false);
    if (!res) return undefined;
    console.log(`Компилируем ${objname}`);
    const { body, norm } = res;
    try {
        return new Function(schemaVarName, header + baseHeader + body + `//# sourceURL=${objname}`) as ClassModel;
    } catch (e) {
        // prettier-ignore
        console.log(norm.split("\n").filter(s => s.trim()).map((s, idx) => `${idx + 1}: ${s}`).join("\n"));
        console.log(body);
        throw Error(`Ошибка eval ${objname}: ${e.message}`);
    }
}

export function translateAsFunction(source: string, vars: ClassVars | undefined, objname: string, lib: ClassLibrary): FunctionModel | undefined {
    const res = compileSource(source, vars, objname, lib, true);
    if (!res) return undefined;
    console.log(`Компилируем ${objname} как функцию`);

    const { body, norm } = res;
    try {
        return new Function(schemaVarName, ...funcParams, header + funcHeader + body + `//# sourceURL=${objname}`) as FunctionModel;
    } catch (e) {
        // prettier-ignore
        console.log(norm.split("\n").filter(s => s.trim()).map((s, idx) => `${idx + 1}: ${s}`).join("\n"));
        console.log(body);
        throw Error(`Ошибка eval ${objname}: ${e.message}`);
    }
}
