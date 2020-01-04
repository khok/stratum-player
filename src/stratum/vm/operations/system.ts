import { Operation, VmStateContainer } from "vm-types";
import { Opcode } from "~/helpers/vm";

function GetAsyncKeyState(ctx: VmStateContainer) {
    const key = ctx.stackPop() as number;
    ctx.stackPush(0);
    // ctx.stackPush(StratumProject.keys[ctx.stackPop()] ? 1 : 0);
}

function CloseAll(ctx: VmStateContainer) {
    ctx.project.stop();
}

export function initSystem(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(Opcode.GETAKEYSTATE, GetAsyncKeyState);
    addOperation(Opcode.V_CLOSEALL, CloseAll);
}
