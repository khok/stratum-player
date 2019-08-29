import { BinaryStream } from "..";
import { OperandType, operandTypes } from "./operands";
import { Opcode } from "../../vm";

type VmFunctionOperand = {
    funcName: string;
    argCount: number;
    argTypes: number[];
    returnType: number;
};

type VmCode = Readonly<{
    code: readonly number[];
    operands: readonly OneOfVmOperand[];
    // missingCommands: readonly string[];
}>;

function readFunctionData(stream: BinaryStream): VmFunctionOperand {
    const offset = stream.readWord() * 2;

    const pos = stream.position;

    const funcName = stream.readCharSeq();

    stream.seek(pos + offset);

    const argCount = stream.readWord();

    const argTypes = new Array<number>(argCount);

    for (let i = argCount - 1; i >= 0; i--) {
        const argType = stream.readWord();

        if (argType > 0) throw "not released yet";

        argTypes[i] = argType;
    }

    const returnType = stream.readWord();

    if (returnType > 0) throw "not released yet";

    return { funcName, argCount, argTypes, returnType };
}

function readDllFunctionData(stream: BinaryStream) {
    const offset = stream.readWord() * 2;
    const pos = stream.position;
    const funcName = stream.readCharSeq();
    stream.seek(pos + offset);
    return funcName;
}

function readOperand(stream: BinaryStream, type: OperandType) {
    switch (type) {
        case OperandType.varId:
            return stream.readWord();
        case OperandType.double:
            return stream.readDouble();
        case OperandType.uint:
            return stream.readUint();
        case OperandType.string:
            return stream.readStringTrimmed();
        case OperandType.codepoint:
            return stream.readWord();
        case OperandType.word:
            return stream.readWord();
        case OperandType.function_ptr:
            return readFunctionData(stream);
        case OperandType.dll_function:
            return readDllFunctionData(stream);
        default:
            return undefined;
    }
}

type VmOperand = ReturnType<typeof readOperand>;
type OneOf<T> = (T extends any ? (k: T) => void : never) extends ((k: infer I) => void) ? I : never;
type OneOfVmOperand = OneOf<VmOperand>;

//Переводит кодпоинты в индексы команд в массиве
function transformCodepoints(operands: Array<any>, operandTypes: Array<OperandType>, codepoints: Array<number>) {
    for (let i = 0; i < operands.length; i++) {
        if (operandTypes[i] !== OperandType.codepoint) continue;

        const targetPoint = (operands[i] as number) * 2;
        for (let j = 0; j < operands.length; j++) {
            if (codepoints[j] === targetPoint) {
                operands[i] = j;
                break;
            }
        }
    }
}

function convertVmCode(stream: BinaryStream, codesize: number): VmCode {
    const code: Array<number> = [];
    const operands: Array<OneOfVmOperand> = [];
    const codepoints: Array<number> = [];
    const readedOperandTypes: Array<OperandType> = [];

    const start = stream.position;
    const end = start + codesize * 2;

    while (stream.position < end) {
        codepoints.push(stream.position - start);
        const opcode = stream.readWord();
        if (!Opcode[opcode]) throw new Error(`Неизвестный опкод: ${opcode}`);

        const operandType = operandTypes[opcode];
        const readedOperand = <OneOfVmOperand>readOperand(stream, operandType);

        code.push(opcode);
        operands.push(readedOperand);
        readedOperandTypes.push(operandType);

        //Раскоментить в случае ошибок с считыванием кода
        // console.log(getOpcodeName(opcode) + (readedOperand !== undefined ? (', ' + readedOperand) : ''));
    }

    transformCodepoints(operands, readedOperandTypes, codepoints);
    return { code, operands };
}

export { VmFunctionOperand, OneOfVmOperand, VmCode, convertVmCode };
