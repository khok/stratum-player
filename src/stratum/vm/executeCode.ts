import { ParsedCode } from "vm-types";
import { VmOperations } from "./operations";
import { VmContext } from "./vmContext";
import { Opcode } from "~/helpers/vmConstants";
import realCommandNames from "~/helpers/showMissingCommands/realCommandNames.json";
import { rapidBytecodePrint } from "~/helpers/rapidBytecodePrint";

const OPCODE_MASK = 2047;
const DOUBLE_OPERAND_FLAG_MASK = 2048;
// const LONG_OPERAND_FLAG_MASK = 4096;
const STRING_OPERAND_FLAG_MASK = 8192;
const OTHER_OPERAND_FLAG_MASK = 16384;

export function executeCode(ctx: VmContext, { code, numberOperands, stringOperands, otherOperands }: ParsedCode) {
    let cmd: number,
        cmdIndex: number,
        iterCount: number = 0;
    ctx.jumpTo(0);
    ctx.setCodeLength(code.length);
    try {
        while (((cmd = code[(cmdIndex = ctx.nextCmdIndex++)]) & OPCODE_MASK) !== 0) {
            if (++iterCount > 10000) {
                ctx.setError("Число итераций перевалило за 10000");
                return;
            }

            const op = VmOperations[cmd & OPCODE_MASK];
            if (cmd < DOUBLE_OPERAND_FLAG_MASK) {
                op(ctx);
            } else if (cmd < STRING_OPERAND_FLAG_MASK) {
                op(ctx, numberOperands[cmdIndex]);
            } else if (cmd < OTHER_OPERAND_FLAG_MASK) {
                op(ctx, stringOperands[cmdIndex]);
            } else {
                op(ctx, otherOperands[cmdIndex]);
            }
        }
    } catch (e) {
        if (!(e instanceof TypeError)) throw e;
        const message = `Функция не реализована: ${realCommandNames[cmd! & OPCODE_MASK]} (${
            Opcode[cmd! & OPCODE_MASK]
        })`;
        // rapidBytecodePrint(ctx.currentClass.protoName, ctx.project.classCollection);
        ctx.setError(message);
    }
}
