import { Operation, VmStateContainer } from "vm-types";
import { Opcode } from "~/helpers/vm";

/**
 * Сделать нормально
 */
export const systemKeysTemp = new Uint8Array(2);

function GetAsyncKeyState(ctx: VmStateContainer) {
    const key = ctx.stackPop() as number;
    ctx.stackPush(systemKeysTemp[key]);
}

function CloseAll(ctx: VmStateContainer) {
    throw new Error("Не умею останавливаться");
}

export function initSystem(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(Opcode.GETAKEYSTATE, GetAsyncKeyState);
    addOperation(Opcode.V_CLOSEALL, CloseAll);
}
