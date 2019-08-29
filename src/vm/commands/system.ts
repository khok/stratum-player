import { VmCommand } from ".";
import { Opcode, IVirtualMachine } from "..";

function GETAKEYSTATE(ctx: IVirtualMachine) {
    // ctx.stackPush(StratumProject.keys[ctx.stackPop()] ? 1 : 0);
}

export default function init(addCommand: (opcode: number, command: VmCommand) => void) {
    addCommand(Opcode.GETAKEYSTATE, GETAKEYSTATE);
}
