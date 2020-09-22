import { ExecutionContext } from "./executionContext";

export type NumBool = 0 | 1;

export interface ParsedCode {
    /**
     * Масссив опкодов, совмещенных с кодами типов операндов.
     * Опкод извлекается так:`code[index] & 2047`
     */
    code: Uint16Array; //возможно, Int быстрее чем Uint
    // одного массива как для handle, так и для double по перформансу должно хватить,
    // т.к. handle дергаются реже. Я на выборе массива операндов больше проиграю.
    numberOperands: Float64Array;
    stringOperands: string[];
    otherOperands: FunctionSignature[];
}

export type Operation = (ctx: ExecutionContext, operand?: OperationArg) => void;

export interface FunctionSignature {
    funcName: string;
    argCount: number;
    argTypes: number[];
    returnType: number;
}

export type OperationArg = undefined | number | string | FunctionSignature;

/**
 * Тип аргумента инструкции
 *
 * double - float-point, 8 байтов;
 *
 * long - целое знаковое, 4 байта;
 *
 * string - строка переменной длины (нуль-терминированная);
 *
 * varIndex - индекс переменной имиджа (беззнаковое целое, 2 байта);
 *
 * argCount - количество аргументов функции с переменной длиной аргументов
 * (беззнаковое целое, 2 байта)
 *
 * funcSignature - данные для выполнения вызова имиджа-функции (см `FuncSignature`)
 *
 * dllFuncSignature - данные для вызова функции из DLL (не реализовано)
 */
export type OperationArgType = "double" | "long" | "string" | "codepoint" | "varId" | "argCount" | "funcSignature" | "dllFuncSignature";
