import { StratumError } from "../../errors";
import { Opcode } from "../../vm/opcode";
import { operandTypes } from "../../vm/operations";
import { Bytecode, FunctionOperand, Operand, OperandType } from "../../vm/types";
import { BinaryStream } from "../binaryStream";

function readFunctionData(stream: BinaryStream): FunctionOperand {
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

function readOperand(stream: BinaryStream, type: OperandType): Operand {
    switch (type) {
        case "varId":
            return stream.readWord();
        case "double":
            return stream.readDouble();
        case "uint":
            return stream.readUint();
        case "string":
            return stream.readStringTrimmed();
        case "codepoint":
            return stream.readWord();
        case "word":
            return stream.readWord();
        case "functionData":
            return readFunctionData(stream);
        case "dllFunctionData":
            return readDllFunctionData(stream);
    }
}

export function parseBytecode(stream: BinaryStream, codesize: number): Bytecode {
    type OperationData = { opcode: number; operand?: Operand; operandType?: OperandType };
    const opData: OperationData[] = [];
    const codepoints: number[] = [];

    const start = stream.position;
    const end = start + codesize * 2;

    while (stream.position < end) {
        codepoints.push(stream.position - start);

        const opcode = stream.readWord();
        const operandType = operandTypes[opcode];
        const res: OperationData = { opcode, operandType };
        if (operandType) res.operand = readOperand(stream, operandType);

        opData.push(res);
        //Раскоментить в случае ошибок с считыванием кода
        // console.log(Opcode[opcode] + (operand !== undefined ? (', ' + operand) : ''));
    }

    //трансформируем кодпоинты в идексы и удаляем типы
    for (let i = 0; i < opData.length; i++) {
        const { operand, operandType } = opData[i];
        if (operandType != "codepoint") continue;
        const target = (operand as number) * 2;
        opData[i].operand = codepoints.indexOf(target);
    }

    const code = new Uint16Array(opData.map(c => c.opcode));
    // const haveOperands = new Uint8Array(opData.map(c => (c.operand != undefined ? 1 : 0)));
    // const operands = opData.map(c => c.operand);
    const numberOperands = new Float32Array(code.length);
    const stringOperands = new Array<string>(code.length);
    const otherOperands = new Array<Operand | undefined>(code.length);
    for (let i = 0; i < code.length; i++) {
        const { operand, operandType } = opData[i];
        if (operandType == undefined) continue;
        switch (operandType) {
            case "double":
            case "codepoint":
            case "uint":
            case "varId":
            case "word":
                numberOperands[i] = <number>operand;
                code[i] |= 1 << 14;
                break;
            case "string":
                stringOperands[i] = <string>operand;
                code[i] |= 2 << 14;
                break;
            default:
                otherOperands[i] = operand;
                code[i] |= 3 << 14;
                break;
        }
    }

    return { code, /*haveOperands,*/ numberOperands, stringOperands, otherOperands };
}
