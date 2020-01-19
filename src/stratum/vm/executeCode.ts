import { ParsedCode } from "vm-types";
import { VmOperations } from "./operations";
import { VmContext } from "./vmContext";

const OPCODE_MASK = 2047;
const IS_NUMBER_OPERAND_MASK = 16384;
const IS_STRING_OPERAND_MASK = 32768;
const IS_OTHER_OPERAND_MASK = 49152;

export function executeCode(ctx: VmContext, { code, numberOperands, stringOperands, otherOperands }: ParsedCode) {
    let cmd: number,
        cmdIndex: number,
        iterCount: number = 0;
    ctx.jumpTo(0);
    ctx.setCodeLength(code.length);
    while ((cmd = code[(cmdIndex = ctx.nextCommandIndex())]) & OPCODE_MASK) {
        if (++iterCount > 10000) {
            ctx.setError("Число итераций перевалило за 10000");
            return;
        }

        const op = VmOperations[cmd & OPCODE_MASK];
        if (cmd < IS_NUMBER_OPERAND_MASK) {
            op(ctx);
            continue;
        }
        if (cmd < IS_STRING_OPERAND_MASK) {
            op(ctx, numberOperands[cmdIndex]);
            continue;
        }
        if (cmd < IS_OTHER_OPERAND_MASK) {
            op(ctx, stringOperands[cmdIndex]);
            continue;
        }
        op(ctx, otherOperands[cmdIndex]);
    }
}
