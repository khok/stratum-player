import { OpCode } from "../consts";
import { ExecutionContext } from "../executionContext";
import { Operation } from "../types";

// FLOAT MCISendString(STRING String)
function MCISendString_int(ctx: ExecutionContext) {
    const data = ctx.popString();
    // console.warn(`Вызвана MCISendString(${data})`);
    ctx.pushDouble(-1);
}

export function initMultimedia(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(OpCode.MCISENDSTRING_INT, MCISendString_int);
}
