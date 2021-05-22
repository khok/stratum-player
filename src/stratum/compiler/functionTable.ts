import { envVar, EXIT_CODE, prjVar, schemaArg } from "./compilerConsts";

export interface FuncInfo {
    f: string;
    blocking?: boolean;
    /**
     * Функция инлайнится (template - прямо в код; inner - определение вверху модели).
     */
    inline?: "template" | "inner";
}

export const funcTable: Map<string, FuncInfo> = new Map([
    ["EXIT", { f: `return ${EXIT_CODE}`, inline: "template" }],
    // Преобразования
    ["FLOAT", { f: "parseFloat(#0)||0", inline: "template" }],
    ["HANDLE", { f: "parseInt(#0)||0", inline: "template" }],
    ["STRING", { f: "(Math.round((#0)*100000)/100000).toString()", inline: "template" }],
    // Арифметика
    ["ABS", { f: "Math.abs(#0)||0", inline: "template" }],
    ["AVERAGE", { f: "(#0)/2+(#1)/2", inline: "template" }],
    ["EXP", { f: "Math.exp(#0)||0", inline: "template" }],
    ["LG", { f: "lg", inline: "inner" }],
    ["LN", { f: "ln", inline: "inner" }],
    ["LOG", { f: "log", inline: "inner" }],
    ["MAX", { f: "Math.max(#0, #1)||0", inline: "template" }],
    ["MIN", { f: "Math.min(#0, #1)||0", inline: "template" }],
    ["LIMIT", { f: "Math.max(#1, Math.min(#2, #0))||0", inline: "template" }], //порядок аргументов?
    ["ROUND", { f: "round", inline: "inner" }],
    ["SQR", { f: "(#0)**2", inline: "template" }],
    ["SQRT", { f: "Math.sqrt(#0)||0", inline: "template" }],
    ["TRUNC", { f: "Math.trunc(#0)||0", inline: "template" }], //FIXME: нет в IE
    ["RND", { f: "(#0)*Math.random()", inline: "template" }],
    // Тригонометрия
    ["ARCCOS", { f: "arccos", inline: "inner" }],
    ["ARCSIN", { f: "arcsin", inline: "inner" }],
    ["ARCTAN", { f: "Math.atan(#0)||0", inline: "template" }],
    ["COS", { f: "Math.cos(#0)||0", inline: "template" }],
    ["SIN", { f: "Math.sin(#0)||0", inline: "template" }],
    ["TAN", { f: "Math.tan(#0)||0", inline: "template" }],
    ["DEG", { f: "180*(#0)/Math.PI||0", inline: "template" }],
    ["RAD", { f: "Math.PI*(#0)/180||0", inline: "template" }],
    ["GETANGLEBYXY", { f: "getAngleByXY", inline: "inner" }],
    // Логика
    ["AND", { f: "(#0)&&(#1)", inline: "template" }],
    ["DELTA", { f: "(#0)?0:1", inline: "template" }],
    ["ED", { f: "(#0)>0?1:0", inline: "template" }],
    ["NOT", { f: "!(#0)", inline: "template" }],
    ["NOTBIN", { f: "#0", inline: "template" }], // NOTBIN возвращает то же число из-за бага
    ["OR", { f: "(#0)||(#1)", inline: "template" }],
    ["SGN", { f: "Math.sign(#0)||0", inline: "template" }], //FIXME: нет в IE
    ["XOR", { f: "(#0)!==0^(#1)!==0", inline: "template" }],
    ["XORBIN", { f: "(#0)^(#1)", inline: "template" }],
    // Строки
    ["ALLTRIM", { f: "(#0).trim()", inline: "template" }],
    ["CHANGE", { f: "change", inline: "inner" }],
    ["COMPARE", { f: "(#0)===(#1)", inline: "template" }],
    ["COMPAREI", { f: "compareI", inline: "inner" }],
    ["LEFT", { f: "(#0).substring(0,#1)", inline: "template" }],
    ["LENGTH", { f: "(#0).length", inline: "template" }],
    ["LOWER", { f: "(#0).toLowerCase()", inline: "template" }],
    ["LTRIM", { f: '(#0).replace(/^\\s+/,"")', inline: "template" }],
    ["POS", { f: "pos", inline: "inner" }],
    ["REPLICATE", { f: "(#0).repeat(#1)", inline: "template" }], //FIXME: нет в IE
    ["SUBSTR", { f: "(#0).substr(#1,#2)", inline: "template" }], //FIXME: substr лучше не использовать.
    ["RIGHT", { f: "right", inline: "inner" }],
    ["RTRIM", { f: '(#0).replace(/\\s+$/,"")', inline: "template" }],
    ["UPPER", { f: "(#0).toUpperCase()", inline: "template" }],
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
