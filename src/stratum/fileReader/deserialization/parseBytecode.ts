import { ParsedCode, FunctionOperand, Operand, OperandType } from "vm-types";
import { BinaryStream } from "~/helpers/binaryStream";
import { operandTypes } from "~/helpers/vmConstants";
import { StratumError } from "~/helpers/errors";

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

type OperationData = { opcode: number; operand?: Operand; operandType?: OperandType };

//TODO: Переписать код парсинга
export function parseBytecode(stream: BinaryStream, codesize: number): ParsedCode {
    const operations: OperationData[] = [];
    const codepoints: number[] = [];

    const start = stream.position;
    const end = start + codesize * 2;

    while (stream.position < end) {
        const codepoint = stream.position - start;
        codepoints.push(codepoint);

        const opcode = stream.readWord();
        const operandType = operandTypes[opcode];
        const res: OperationData = { opcode, operandType };
        if (operandType) res.operand = readOperand(stream, operandType);

        operations.push(res);
    }

    /*
     * кодпоинт - аргумент функции перехода, содержащий индекс конкретной команды в байткоде
     * (точки перехода).
     * Здесь мы преобразуем кодпоинты в индексы команд в массиве `operations`
     */
    for (let i = 0; i < operations.length; i++) {
        const { operand, operandType } = operations[i];
        if (operandType !== "codepoint") continue;
        const targetIndex = (operand as number) * 2;
        operations[i].operand = codepoints.indexOf(targetIndex);
    }

    const code = new Uint16Array(operations.map(c => c.opcode));
    const numberOperands = new Float32Array(code.length);
    const stringOperands = new Array<string>(code.length);
    const otherOperands = new Array<Operand | undefined>(code.length);
    for (let i = 0; i < code.length; i++) {
        const { operand, operandType } = operations[i];
        if (operandType === undefined) continue;
        //выставляем флаг (1 2 или 3) в зависимости от типа операнда
        switch (operandType) {
            case "varId":
                numberOperands[i] = <number>operand;
                code[i] |= 8192; //1 << 13;
                code[i] |= 16384; //1 << 14;
                break;
            case "double":
            case "codepoint":
            case "uint":
            case "word":
                numberOperands[i] = <number>operand;
                code[i] |= 16384; //1 << 14;
                break;
            case "string":
                stringOperands[i] = <string>operand;
                code[i] |= 32768; //2 << 14;
                break;
            default:
                otherOperands[i] = operand;
                code[i] |= 49152; //3 << 14;
                break;
        }
    }

    if (code.length === 0) throw Error("Impossible error");
    if (code[code.length - 1] !== 0) {
        // console.dir({ code, numberOperands, stringOperands, otherOperands });
        throw new StratumError("Последний опкод - не 0");
    }

    return { code, numberOperands, stringOperands, otherOperands };
}
