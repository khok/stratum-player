import { Opcode } from "../opcode";
import { Operation, VmContext } from "../types";

function GetAsyncKeyState(ctx: VmContext) {
    ctx.stackPush(0);
    // ctx.stackPush(StratumProject.keys[ctx.stackPop()] ? 1 : 0);
}

function CloseAll(ctx: VmContext) {
    ctx.project.stopComputing();
}

export function initSystem(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(Opcode.GETAKEYSTATE, GetAsyncKeyState);
    addOperation(Opcode.V_CLOSEALL, CloseAll);
}
