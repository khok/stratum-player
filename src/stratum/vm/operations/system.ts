import { Operation, VmStateContainer } from "vm-types";
import { Opcode } from "~/helpers/vmConstants";

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

function system(ctx: VmStateContainer, paramCount: number) {
    const params = new Array<number>(paramCount);
    for (let i = paramCount - 1; i >= 0; i--) params[i] = ctx.stackPop() as number;
    const command = ctx.stackPop() as number;
    console.log(`System(${command}, ${params})`);
    ctx.stackPush(1);
}

//TODO: перетащить значения getscreenheight, getareaheight из windows.ts в этот файл

export function initSystem(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(Opcode.GETAKEYSTATE, GetAsyncKeyState);
    addOperation(Opcode.V_CLOSEALL, CloseAll);
    addOperation(Opcode.V_SYSTEM, system as Operation);
}
