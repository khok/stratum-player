import { envVar, EXIT_CODE, prjVar, schemaArg } from "./compilerConsts";

export interface FuncInfo {
    f: string;
    blocking?: boolean;
    tmpl?: boolean;
    inner?: boolean;
}

export const funcTable: Map<string, FuncInfo> = new Map([
    ["EXIT", { f: `return ${EXIT_CODE}`, tmpl: true }],
    // Преобразования
    ["FLOAT", { f: "parseFloat(#0)||0", tmpl: true }],
    ["HANDLE", { f: "parseInt(#0)||0", tmpl: true }],
    ["STRING", { f: "(Math.round((#0)*100000)/100000).toString()", tmpl: true }],
    // Арифметика
    ["ABS", { f: "Math.abs(#0)||0", tmpl: true }],
    ["AVERAGE", { f: "(#0)/2+(#1)/2", tmpl: true }],
    ["EXP", { f: "Math.exp(#0)||0", tmpl: true }],
    ["LG", { f: "lg", inner: true }],
    ["LN", { f: "ln", inner: true }],
    ["LOG", { f: "log", inner: true }],
    ["MAX", { f: "Math.max(#0, #1)||0", tmpl: true }],
    ["MIN", { f: "Math.min(#0, #1)||0", tmpl: true }],
    ["LIMIT", { f: "Math.max(#1, Math.min(#2, #0))||0", tmpl: true }], //порядок аргументов?
    ["ROUND", { f: "round", inner: true }],
    ["SQR", { f: "(#0)**2", tmpl: true }],
    ["SQRT", { f: "Math.sqrt(#0)||0", tmpl: true }],
    ["TRUNC", { f: "Math.trunc(#0)||0", tmpl: true }], //FIXME: нет в IE
    ["RND", { f: "(#0)*Math.random()", tmpl: true }],
    // Тригонометрия
    ["ARCCOS", { f: "arccos", inner: true }],
    ["ARCSIN", { f: "arcsin", inner: true }],
    ["ARCTAN", { f: "Math.atan(#0)||0", tmpl: true }],
    ["COS", { f: "Math.cos(#0)||0", tmpl: true }],
    ["SIN", { f: "Math.sin(#0)||0", tmpl: true }],
    ["TAN", { f: "Math.tan(#0)||0", tmpl: true }],
    ["DEG", { f: "180*(#0)/Math.PI||0", tmpl: true }],
    ["RAD", { f: "Math.PI*(#0)/180||0", tmpl: true }],
    ["GETANGLEBYXY", { f: "getAngleByXY", inner: true }],
    // Логика
    ["AND", { f: "(#0)&&(#1)", tmpl: true }],
    ["DELTA", { f: "(#0)?0:1", tmpl: true }],
    ["ED", { f: "(#0)>0?1:0", tmpl: true }],
    ["NOT", { f: "!(#0)", tmpl: true }],
    ["NOTBIN", { f: "#0", tmpl: true }], // NOTBIN возвращает то же число из-за бага
    ["OR", { f: "(#0)||(#1)", tmpl: true }],
    ["SGN", { f: "Math.sign(#0)||0", tmpl: true }], //FIXME: нет в IE
    ["XOR", { f: "(#0)!==0^(#1)!==0", tmpl: true }],
    ["XORBIN", { f: "(#0)^(#1)", tmpl: true }],
    // Строки
    ["ALLTRIM", { f: "(#0).trim()", tmpl: true }],
    ["CHANGE", { f: '(#0).replace(new RegExp(#1, "g"), #2)', tmpl: true }],
    ["COMPARE", { f: "(#0)===(#1)", tmpl: true }],
    ["COMPAREI", { f: "compareI", inner: true }],
    ["LEFT", { f: "(#0).substring(0,#1)", tmpl: true }],
    ["LENGTH", { f: "(#0).length", tmpl: true }],
    ["LOWER", { f: "(#0).toLowerCase()", tmpl: true }],
    ["LTRIM", { f: '(#0).replace(/^\\s+/,"")', tmpl: true }],
    ["POS", { f: "pos", inner: true }],
    ["REPLICATE", { f: "(#0).repeat(#1)", tmpl: true }], //FIXME: нет в IE
    ["SUBSTR", { f: "(#0).substr(#1,#2)", tmpl: true }], //FIXME: substr лучше не использовать.
    ["RIGHT", { f: "right", inner: true }],
    ["RTRIM", { f: '(#0).replace(/\\s+$/,"")', tmpl: true }],
    ["UPPER", { f: "(#0).toUpperCase()", tmpl: true }],
]);

// Регекс для поиска ошибок: stratum_.*\)\s\{
// Для поиска ошибок async: stratum_.*Promise.*\{
// Все функции нач с "stratum_" должны быть типизированы.
type CtxNameType = (typeof schemaArg | typeof prjVar | typeof envVar) & ("prj" | "env" | "schema");
export function installContextFunctions<T extends Function>(f: T, contextName: CtxNameType): void {
    const PREFIX = "stratum_";
    const PREF_LEN = PREFIX.length;
    const ASYNC_PREF = "async_";
    const ASYNC_PREF_LEN = ASYNC_PREF.length;
    (Object.getOwnPropertyNames(f.prototype) as (keyof T)[]).forEach((c) => {
        const v = f.prototype[c];
        if (typeof v !== "function" || !v.name.startsWith(PREFIX)) return;

        let realName = c.toString().substring(PREF_LEN);
        const blocking = realName.startsWith(ASYNC_PREF);
        if (blocking) realName = realName.substring(ASYNC_PREF_LEN);

        const key = realName.toUpperCase();
        const val = { f: `${contextName}.${c}`, blocking };

        const size = funcTable.size;
        funcTable.set(key, val);
        if (size === funcTable.size) throw Error(`Конфликт имен функций: ${realName}`);
    });
}
