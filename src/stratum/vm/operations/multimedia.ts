import { Operation, VmStateContainer } from "vm-types";
import { Opcode } from "~/helpers/vmConstants";

// FLOAT MCISendString(STRING String)
function MCISendString_int(ctx: VmStateContainer) {
    const data = ctx.popString();
    console.warn(`Вызвана MCISendString(${data})`);
    ctx.pushDouble(-1);
}

export function initMultimedia(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(Opcode.MCISENDSTRING_INT, MCISendString_int);
}
