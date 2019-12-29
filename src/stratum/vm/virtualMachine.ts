import { Bytecode } from "vm-types";
import { VmOperations } from "./operations";
import { VmContext } from "./vmContext";

const OPCODE_MASK = 2047;
const NUMBER_OPERAND_MASK = 16384;
const STRING_OPERAND_MASK = 32768;
const OTHER_OPERAND_MASK = 49152;

export function executeCode(ctx: VmContext, { code, numberOperands, stringOperands, otherOperands }: Bytecode) {
    let cmd: number,
        ci: number,
        iterCount: number = 0;
    ctx.jumpTo(0);
    ctx.setCodeLength(code.length);
    while ((cmd = code[(ci = ctx.nextCommandIndex())]) & OPCODE_MASK) {
        if (++iterCount > 10000) {
            ctx.setError("Число итераций перевалило за 10000");
            return;
        }

        const op = VmOperations[cmd & OPCODE_MASK];
        if (cmd < NUMBER_OPERAND_MASK) {
            op(ctx);
            continue;
        }
        if (cmd < STRING_OPERAND_MASK) {
            const oper = numberOperands[ci];
            op(ctx, oper);
            continue;
        }
        if (cmd < OTHER_OPERAND_MASK) {
            op(ctx, stringOperands[ci]);
            continue;
        }
        op(ctx, otherOperands[ci]);
    }
}

// export function computeClass(ctx: VmStateContainer, code: Bytecode, classState: ClassState) {
//     const prevClass = ctx.currentClass;
//     const retPoint = ctx.call(classState);
//     executeCode(ctx, code);
//     ctx.return(prevClass, retPoint);
// }
