import { Operation, VmStateContainer } from "vm-types";
import { Opcode } from "~/helpers/vmConstants";

function PUSHPTRNEW(ctx: VmStateContainer, varId: number) {
    ctx.stackPush(varId);
    ctx.stackPush(1);
}

function PUSHPTR(ctx: VmStateContainer, varId: number) {
    ctx.stackPush(varId);
    ctx.stackPush(0);
}

export function initBase2(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(Opcode.PUSHPTRNEW, PUSHPTRNEW as Operation);
    addOperation(Opcode.PUSHPTR, PUSHPTR as Operation);
}
