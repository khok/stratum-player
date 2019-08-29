import { VmCommand } from ".";
import { Opcode, IVirtualMachine } from "..";

function GetAsyncKeyState(ctx: IVirtualMachine) {
    ctx.stackPush(0);
    // ctx.stackPush(StratumProject.keys[ctx.stackPop()] ? 1 : 0);
}

function CloseAll(ctx: IVirtualMachine) {
    ctx.project.stop();
}

export default function init(addCommand: (opcode: number, command: VmCommand) => void) {
    addCommand(Opcode.GETAKEYSTATE, GetAsyncKeyState);
    addCommand(Opcode.V_CLOSEALL, CloseAll);
}
