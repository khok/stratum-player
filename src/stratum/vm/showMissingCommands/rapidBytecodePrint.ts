import { OpCode } from "../consts";
import { DOUBLE_OPERAND_FLAG_MASK, OPCODE_MASK } from "../consts/operandFlagMasks";
import { ParsedCode } from "../types";

export function rapidBytecodePrint(code: ParsedCode, varNames: string[]) {
    code.code.forEach((c, i) => {
        const op = OpCode[c & OPCODE_MASK].toString();
        const arg =
            c & DOUBLE_OPERAND_FLAG_MASK
                ? c & 4096
                    ? (/push/i.test(op) ? "<- " : "-> ") + varNames[code.numberOperands[i]]
                    : code.numberOperands[i]
                : code.stringOperands[i] !== undefined
                ? `"${code.stringOperands[i]}"`
                : "";
        console.log(`${i}: ${op} ${arg}`);
    });
}
