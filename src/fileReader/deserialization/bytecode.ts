import { Opcode } from "../../vm/opcode";
import { operandTypes, operations } from "../../vm/operations";
import { Bytecode, FunctionOperand, Operand, OperandType, Operation } from "../../vm/types";
import { BinaryStream } from "../binaryStream";
import { StratumError } from "../../errors";

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
    type OperationData = { operation: Operation; operand?: Operand; isCodePoint?: boolean };
    const code: OperationData[] = [];
    const codepoints: number[] = [];

    const start = stream.position;
    const end = start + codesize * 2;

    while (stream.position < end) {
        codepoints.push(stream.position - start);

        const opcode = stream.readWord();
        if (!Opcode[opcode]) throw new StratumError(`Неизвестный опкод: ${opcode}`);
        const operation = operations[opcode]; // || operations[Opcode.V_END];

        const operandType = operandTypes[opcode];
        const res: OperationData = { operation };
        if (operandType) {
            res.operand = readOperand(stream, operandType);
            if (operandType == "codepoint") res.isCodePoint = true;
        }

        code.push(res);
        //Раскоментить в случае ошибок с считыванием кода
        // console.log(Opcode[opcode] + (operand !== undefined ? (', ' + operand) : ''));
    }

    //трансформируем кодпоинты в идексы и удаляем типы
    for (let i = 0; i < code.length; i++) {
        const { operand, isCodePoint } = code[i];
        if (!isCodePoint) continue;
        delete code[i].isCodePoint;
        const target = (operand as number) * 2;
        code[i].operand = codepoints.indexOf(target);
    }

    return code;
}
