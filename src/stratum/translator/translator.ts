import { ClassProtoVars } from "stratum/common/classProto";
import { VarType } from "stratum/fileFormats/cls";
import { ClassModel, Enviroment, EventCode, SchemaFunctions } from ".";
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

type FuncsCollection = Map<string, string>;

function subOpToString(subop: any, vars: ClassProtoVars | undefined, funcs: FuncsCollection) {
    switch (subop.type) {
        case "const": {
            const val = subop.value;
            return val.startsWith("#") ? val.substring(1, val.length) : val;
        }
        case "-":
            return "-" + opToString(subop.operand, vars, funcs);
        case "!":
            return "!" + opToString(subop.operand, vars, funcs);
        case "var": {
            if (!vars) throw Error("Имидж не имеет переменных");
            const nameUC: string = subop.name.toUpperCase();
            const id = vars.nameUCToId.get(nameUC);
            if (id === undefined) {
                const constValue = EventCode[nameUC as keyof typeof EventCode];
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
                    const nm = a.val.first.name;
                    const id = vars.nameUCToId.get(nm.toUpperCase());
                    if (id === undefined) throw Error(`Неопределенная переменная в функции GetTime: ${nm}`);
                    return `${a.val.first.isNew ? "new" : "old"}${floatArr},TLB[${id}]`;
                });
                return `env.getTime(${a.join(",")})`;
            }

            /*
            if (nameUC === "GETACTUALSIZE2D") {
                const floatArr = arrNames.get(VarType.Float);
                if (!vars) throw Error("Имидж не имеет переменных");

                const a0Res = opToString(subop.args[0].val, vars, funcs);
                const a1Res = opToString(subop.args[1].val, vars, funcs);

                const a2 = subop.args[2];
                const a2name = a2.val.first.name;
                const a2id = vars.nameUCToId.get(a2name.toUpperCase());
                if (a2id === undefined) throw Error(`Неопределенная переменная в функции GetActualSize2d: ${a2name}`);
                const a2Res = `${a2.val.first.isNew ? "new" : "old"}${floatArr},TLB[${a2id}]`;

                const a3 = subop.args[3];
                const a3name = a3.val.first.name;
                const a3id = vars.nameUCToId.get(a3name.toUpperCase());
                if (a3id === undefined) throw Error(`Неопределенная переменная в функции GetActualSize2d: ${a3name}`);
                const a3res = `${a3.val.first.isNew ? "new" : "old"}${floatArr},TLB[${a3id}]`;

                console.log(`${graphicsVarName}.getActualSize2d(${a0Res},${a1Res},${a2Res},${a3res})`);
                throw Error();
                return `env.getTime(${a.join(",")})`;
            }
            */

            const fargs = subop.args.map((a: any) => opToString(a.val, vars, funcs));
            if (nameUC === "NOT") return `((${fargs[0]})>0===true?0:1)`;
            if (nameUC === "AND") return `(((${fargs[0]})>0&&(${fargs[1]})>0)===true?1:0)`;

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
            return `(${opToString(subop.body, vars, funcs)})`;
        default:
            console.log(subop);
            throw Error(`Неизвестный операнд: ${subop.type}`);
    }
}

function opToString(op: any, vars: ClassProtoVars | undefined, funcs: FuncsCollection): string {
    const f = subOpToString(op.first, vars, funcs);
    const r = op.rest.map((exp: any) => {
        if (exp.action === "/") return `/(${subOpToString(exp.op, vars, funcs)} || Infinity)`;
        return exp.action + subOpToString(exp.op, vars, funcs);
    });
    return f + r.join("");
}

function parseCodeline(c: any, vars: ClassProtoVars | undefined, funcs: FuncsCollection): string | undefined {
    switch (c.type) {
        case ":=": {
            if (!vars) throw Error("Имидж не имеет переменных");
            // console.log(c.to);
            const id = vars.nameUCToId.get(c.to.toUpperCase());
            if (id === undefined) throw Error(`Неизвестная переменная: ${c.to}`);
            const typ = arrNames.get(vars.types[id]);
            if (!typ) throw Error(`Неизвестный тип переменной: ${vars.types[id]} ${c.to}`);
            return `new${typ}[TLB[${id}]] = ${opToString(c.operand, vars, funcs)};`;
        }
        case "varsDec":
        case "=":
            return undefined;
        case "if":
        case "while":
            return `${c.type} (${opToString(c.expr.body, vars, funcs)}) {`;
        case "endif":
        case "endwhile":
            if (c.then) return `}\n${parseCodeline(c.then, vars, funcs)}`;
            return `}`;
        case "else":
            if (c.then) return `} else {\n${parseCodeline(c.then, vars, funcs)}`;
            return `} else {`;
        case "callChain":
            return c.functions.map((f: any) => `${subOpToString(f, vars, funcs)}`).join("; ") + ";";
        default:
            throw Error(`Неизвестный оператор: ${c.type}`);
    }
}

export function translate(source: string, vars: ClassProtoVars | undefined, objname: string): ClassModel | undefined {
    const norm = normalizeSource(source);
    let data: Array<any>;
    try {
        data = parse(norm);
    } catch (e) {
        console.log(norm);
        throw Error(`Ошибка парсинга ${objname}: ${e.message}`);
    }

    // const errors: string[] = [];
    const funcs = new Map<string, string>();
    let body = "";
    for (let i = 0; i < data.length; i++) {
        try {
            const line = parseCodeline(data[i], vars, funcs);
            if (line) body += line + "\n";
        } catch (e) {
            // prettier-ignore
            console.log(norm.split("\n").filter(s => s.trim()).map((s, idx) => `${idx + 1}: ${s}`).join("\n"));
            throw Error(`Ошибка компиляции ${objname}: ${e.message} в строке ${i + 1}`);
            // errors.push(e.message + ` в строке ${i + 1}`);
        }
    }
    if (body.length === 0) return undefined;

    console.log(`Компилируем ${objname}`);
    // if (errors.length > 0) throw Error(`Ошибка компиляции ${objname}:\n${errors.join(";\n")}.`);
    if (funcs.size) console.warn(`Функции ${[...funcs.values()].join(", ")} в ${objname} не реализованы.`);
    return new Function("schema", "env", header + body + `//# sourceURL=${objname}`) as ClassModel;
}
