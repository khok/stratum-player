import { ClassProtoVars } from "stratum/common/classProto";
import { VarType } from "stratum/fileFormats/cls";
import { ClassModel, Enviroment, Constant, SchemaFunctions } from ".";
import { funcTable, graphicsVarName, projectVarName, schemaVarName } from "./funcTable";
import { normalizeSource } from "./normalizer";
import { parse } from "./parser";

const arrNames = new Map([
    [VarType.Float, "Floats"],
    [VarType.Handle, "Ints"],
    [VarType.ColorRef, "Ints"],
    [VarType.String, "Strings"],
]);
const TLBVarName: keyof SchemaFunctions = "TLB";
const memoryVarName: keyof Enviroment = "memory";

const header = `
function right(a, n) {
    return a.substr(a.length - n);
}
function roundPrec(a, b) {
    const pw = Math.ceil(100 ** b);
    return Math.round(a * pw + Number.EPSILON) / pw;
}
function addSlash(a) {
    return a[a.length - 1] === "\\\\" ? a : a + "\\\\";
}
const { ${TLBVarName} } = ${schemaVarName};
const { ${memoryVarName}: { newFloats, newStrings, newInts, oldFloats, oldInts, oldStrings }, ${projectVarName}, ${graphicsVarName} } = env;
`;

let _hasBug = false;
function subOpToString(subop: any, vars: ClassProtoVars | undefined) {
    if (subop.isNew && subop.type !== "var") _hasBug = true;
    switch (subop.type) {
        case "const": {
            const val = subop.value;
            if (val[0] === "#") return val.substring(1, val.length);
            if (val[0] === '"' || val[0] === "'") return val.split("\\").join("\\\\");
            return val;
        }
        case "-":
            return "-" + opToString(subop.operand, vars);
        case "!":
            return "!" + opToString(subop.operand, vars);
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
            if (!typ) throw Error(`Неизвестный тип переменной: ${vars.types[id]} ${subop.to}`);

            return `${subop.isNew ? "new" : "old"}${typ}[TLB[${id}]]`;
        }
        case "call": {
            const nameUC = subop.name.toUpperCase();
            if (nameUC === "EXIT") return "return";
            if (nameUC === "SYSTEM") return "0";

            if (nameUC === "GETTIME") {
                const floatArr = arrNames.get(VarType.Float);
                if (!vars) throw Error("Имидж не имеет переменных");
                const a = subop.args.map((a: any) => {
                    const nm = a.first.name;
                    const id = vars.nameUCToId.get(nm.toUpperCase());
                    if (id === undefined) throw Error(`Неопределенная переменная в функции GetTime: ${nm}`);
                    return `${a.first.isNew ? "new" : "old"}${floatArr},TLB[${id}]`;
                });
                return `env.getTime(${a.join(",")})`;
            }

            if (nameUC === "GETDATE") {
                const floatArr = arrNames.get(VarType.Float);
                if (!vars) throw Error("Имидж не имеет переменных");
                const a = subop.args.map((a: any) => {
                    const nm = a.first.name;
                    const id = vars.nameUCToId.get(nm.toUpperCase());
                    if (id === undefined) throw Error(`Неопределенная переменная в функции GetDate: ${nm}`);
                    return `${a.first.isNew ? "new" : "old"}${floatArr},TLB[${id}]`;
                });
                return `env.getDate(${a.join(",")})`;
            }

            if (nameUC === "GETACTUALSIZE2D") {
                const floatArr = arrNames.get(VarType.Float);
                if (!vars) throw Error("Имидж не имеет переменных");

                const f1 = subop.args.slice(0, 2).map((a: any) => opToString(a, vars));
                const f2 = subop.args.slice(2, 4).map((a: any) => {
                    const nm = a.first.name;
                    const id = vars.nameUCToId.get(nm.toUpperCase());
                    if (id === undefined) throw Error(`Неопределенная переменная в функции GetActualSize2d: ${nm}`);
                    return `${a.first.isNew ? "new" : "old"}${floatArr},TLB[${id}]`;
                });
                return `${graphicsVarName}.getActualSize2d(${f1.join(",")},${f2.join(",")})`;
            }

            const fargs = subop.args.map((a: any) => opToString(a, vars));
            if (nameUC === "NOT") return `((${fargs[0]})>0===true?0:1)`;
            if (nameUC === "AND") return `(((${fargs[0]})>0&&(${fargs[1]})>0)===true?1:0)`;

            if (nameUC === "SQR") return `(${fargs[0]})**2`;

            if (nameUC === "ABS") return `(Math.abs(${fargs[0]})||0)`;
            if (nameUC === "TRUNC") return `(Math.trunc(${fargs[0]})||0)`;
            if (nameUC === "SQRT") return `(Math.sqrt(${fargs[0]})||0)`;
            if (nameUC === "SIN") return `(Math.sin(${fargs[0]})||0)`;
            if (nameUC === "COS") return `(Math.cos(${fargs[0]})||0)`;
            if (nameUC === "MIN") return `(Math.min(${fargs[0]}, ${fargs[1]})||0)`;
            if (nameUC === "MAX") return `(Math.max(${fargs[0]}, ${fargs[1]})||0)`;

            if (nameUC === "AVERAGE") return `((${fargs[0]})/2+(${fargs[1]})/2)`;

            if (nameUC === "HANDLE") return `(parseInt(${fargs[0]})||0)`;
            if (nameUC === "FLOAT") return `(parseFloat(${fargs[0]})||0)`;
            if (nameUC === "STRING") return `(Math.round((${fargs[0]})*100000)/100000).toString()`;

            if (nameUC === "LENGTH") return `(${fargs[0]}).length`;
            if (nameUC === "SUBSTR") return `(${fargs[0]}).substr(${fargs[1]},${fargs[2]})`;
            if (nameUC === "LEFT") return `(${fargs[0]}).substr(0,${fargs[1]})`;
            if (nameUC === "RIGHT") return `right(${fargs[0]}, ${fargs[1]})`;

            const fname = funcTable.get(nameUC);
            if (!fname) funcs.set(nameUC, subop.name);
            // if (!fname) throw Error(`Функция не реализована: ${subop.name}`);
            return `${fname || subop.name}(${fargs.join(",")})`;
        }
        case "expression":
            return `(${opToString(subop.body, vars)})`;
        default:
            console.log(subop);
            throw Error(`Неизвестный операнд: ${subop.type}`);
    }
}

function opToString(op: any, vars: ClassProtoVars | undefined): string {
    const f = subOpToString(op.first, vars);
    const r = op.rest.map((exp: any) => {
        if (exp.action === "/") return `/(${subOpToString(exp.op, vars)} || Infinity)`;
        return exp.action + subOpToString(exp.op, vars);
    });
    return f + r.join("");
}

let _hasEquals = false;
function parseCodeline(c: any, vars: ClassProtoVars | undefined): string | undefined {
    switch (c.type) {
        case ":=": {
            if (!vars) throw Error("Имидж не имеет переменных");
            // console.log(c.to);
            const id = vars.nameUCToId.get(c.to.toUpperCase());
            if (id === undefined) throw Error(`Неизвестная переменная: ${c.to}`);
            const typ = arrNames.get(vars.types[id]);
            if (!typ) throw Error(`Неизвестный тип переменной: ${vars.types[id]} ${c.to}`);
            return `new${typ}[TLB[${id}]] = ${opToString(c.operand, vars)};`;
        }
        case "varsDec":
            return undefined;
        case "=":
            _hasEquals = true;
            return undefined;
        case "switch":
            return "do{let exc=false;{";
        case "case":
            return `}if ((${opToString(c.expr.body, vars)})&&exc===false) {exc=true;`;
        case "default":
            return `}if (exc===false) {exc=true;`;
        case "endswitch":
            return `}}while(false);`;
        case "if":
        case "while":
            return `${c.type} (${opToString(c.expr.body, vars)}) {`;
        case "endif":
        case "endwhile":
            return `}`;
        case "else":
            return `} else {`;
        case "do":
            return "do {";
        case "until":
            return `}\nwhile(${opToString(c.expr.body, vars)});`;
        case "break":
            return "break;";
        case "callChain":
            return c.functions.map((f: any) => `${subOpToString(f, vars)}`).join("; ") + ";";
        default:
            throw Error(`Неизвестный оператор: ${c.type}`);
    }
}

const funcs = new Map<string, string>();
export const unreleasedFunctions = new Map<string, string>();
export function translate(source: string, vars: ClassProtoVars | undefined, objname: string): ClassModel | undefined {
    funcs.clear();
    const norm = normalizeSource(source);
    let data: Array<any>;
    try {
        data = parse(norm);
    } catch (e) {
        console.log(norm);
        throw Error(`Ошибка парсинга ${objname}: ${e.message}`);
    }

    if (data[0].type === "function") {
        console.warn(`Объявление ${objname} как функции не реализовано`);
        return undefined;
    }

    let body = "";
    _hasEquals = _hasBug = false;
    for (let i = 0; i < data.length; ++i) {
        try {
            const cd = data[i];
            {
                const line = parseCodeline(cd, vars);
                if (line) body += line + "\n";
            }
            let th = cd.then;
            while (th) {
                const line = parseCodeline(th, vars);
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

    console.log(`Компилируем ${objname}`);
    if (funcs.size > 0) console.warn(`Функции ${[...funcs.values()].join(", ")} в ${objname} не реализованы.`);
    funcs.forEach((v, k) => unreleasedFunctions.set(k, v));
    try {
        return new Function("schema", "env", header + body + `//# sourceURL=${objname}`) as ClassModel;
    } catch (e) {
        // prettier-ignore
        console.log(norm.split("\n").filter(s => s.trim()).map((s, idx) => `${idx + 1}: ${s}`).join("\n"));
        console.log(body);
        throw Error(`Ошибка eval ${objname}: ${e.message}`);
    }
}
