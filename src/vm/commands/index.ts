import { IVirtualMachine, Opcode } from "..";
import { OneOfVmOperand } from "../../deserializers/vmCode";

import initAdvanced from "./advanced";
import initBase from "./base";
import initGSpace from "./graphicSpace";
import initWindows from "./windows";
import initSystem from "./system";

export const commands = new Array<VmCommand>(Opcode.VM_MAXIMUM_code + 1);
export type VmCommand = (ctx: IVirtualMachine, operand: OneOfVmOperand) => void;

(function() {
    function ac(opcode: number, command: VmCommand) {
        if (commands[opcode]) throw "Command already exist: " + Opcode[opcode];
        commands[opcode] = command;
    }

    initBase(ac);
    initWindows(ac);
    initAdvanced(ac);
    initGSpace(ac);
    initSystem(ac);
})();
