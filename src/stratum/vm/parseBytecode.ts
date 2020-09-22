import { BinaryStream } from "~/helpers/binaryStream";
import { operandTypes } from "./consts";
import { DOUBLE_OPERAND_FLAG_MASK, OTHER_OPERAND_FLAG_MASK, STRING_OPERAND_FLAG_MASK } from "./consts/operandFlagMasks";
import { FunctionSignature, OperationArgType, ParsedCode } from "./types";

type OperandType = ReturnType<typeof readOperand> | undefined;

function readFunctionData(stream: BinaryStream): FunctionSignature {
    const offset = stream.readWord() * 2;

    const pos = stream.position;
    const funcName = stream.readCharSeq(offset);
    stream.seek(pos + offset);

    const argCount = stream.readWord();
    const argTypes = new Array<number>(argCount);
    for (let i = argCount - 1; i >= 0; i--) {
        const argType = stream.readInt16();
        if (argType > 0) throw new Error(`Функция ${funcName}: неизвестный тип аргумента ${i}.`);
        argTypes[i] = argType;
    }

    const returnType = stream.readInt16();
    if (returnType > 0) throw new Error(`Функция ${funcName}: неизвестный возвращаемый тип.`);

    return { funcName, argCount, argTypes, returnType };
}

function readDllFunctionData(stream: BinaryStream) {
    const offset = stream.readWord() * 2;
    const pos = stream.position;
    const funcName = stream.readCharSeq(offset);
    stream.seek(pos + offset);
    return funcName;
}

function readOperand(stream: BinaryStream, type: OperationArgType) {
    switch (type) {
        case "double":
            return { type, value: stream.readDouble() };
        case "varId":
        case "codepoint":
        case "argCount":
            return { type, value: stream.readWord() };
        case "long":
            return { type, value: stream.readLong() };
        case "string":
            return { type, value: stream.readStringTrimmed() };
        case "funcSignature":
            return { type, value: readFunctionData(stream) };
        case "dllFuncSignature":
            return { type, value: readDllFunctionData(stream) };
        default:
            throw new Error(`Неизвестный тип операнда: ${type}`);
    }
}

function readRawValues(stream: BinaryStream, codesize: number) {
    const codepoints = new Array<number>();
    const opcodes = new Array<number>();
    const operands = new Array<OperandType>();

    const start = stream.position;
    const end = start + codesize;

    while (stream.position < end) {
        const codepoint = stream.position - start;
        const opcode = stream.readWord();
        const opType = operandTypes[opcode];
        const operand = opType && readOperand(stream, opType);
        codepoints.push(codepoint);
        opcodes.push(opcode);
        operands.push(operand);
    }
    return { codepoints, opcodes, operands };
}

/**
 * Преобразовывает кодпоинты в индексы команд в массиве `operands`.
 */
function transformCodepoints(codepoints: number[], operands: OperandType[]) {
    for (let i = 0; i < codepoints.length; i++) {
        const operand = operands[i];
        if (operand === undefined || operand.type !== "codepoint") continue;
        const targetCodepoint = operand.value * 2;
        const targetIndex = codepoints.indexOf(targetCodepoint);
        if (targetIndex === -1) return false;
        operand.value = targetIndex;
    }
    return true;
}

function splitReadedValues(opcodes: number[], operands: OperandType[]) {
    const code = new Uint16Array(opcodes);
    const numberOperands = new Float64Array(code.length);
    // const intOperands = new Int32Array(code.length);
    const stringOperands = new Array<string>(code.length);
    const otherOperands = new Array<FunctionSignature>(code.length);
    for (let i = 0; i < code.length; i++) {
        const operand = operands[i];
        if (operand === undefined) continue;
        //На 11 позиции выставляем флаг (1, 2, 4, 8) в зависимости от типа операнда
        switch (operand.type) {
            //
            case "varId":
                code[i] |= 4096; //для принтера байткода (см. rapidBytecodePrint)
                numberOperands[i] = operand.value;
                code[i] |= DOUBLE_OPERAND_FLAG_MASK;
                break;
            case "argCount":
            case "codepoint":
            case "long":
            case "double":
                numberOperands[i] = operand.value;
                code[i] |= DOUBLE_OPERAND_FLAG_MASK;
                break;
            case "string":
                stringOperands[i] = operand.value;
                code[i] |= STRING_OPERAND_FLAG_MASK;
                break;
            case "funcSignature":
                otherOperands[i] = operand.value;
                code[i] |= OTHER_OPERAND_FLAG_MASK;
                break;
        }
    }
    return { code, numberOperands, stringOperands, otherOperands };
}

export function parseBytecode(stream: BinaryStream, codesize: number): ParsedCode {
    const { codepoints, opcodes, operands } = readRawValues(stream, codesize);

    if (!transformCodepoints(codepoints, operands)) throw new Error("Ошибка в преобразовании точек перехода.");

    const { code, numberOperands, stringOperands, otherOperands } = splitReadedValues(opcodes, operands);

    if (code.length === 0) throw new Error("Не считано ни одного опкода.");
    if (code[code.length - 1] !== 0) {
        // console.dir({ code, numberOperands, stringOperands, otherOperands });
        throw new Error("Последний опкод - не 0.");
    }

    return { code, numberOperands, stringOperands, otherOperands };
}
