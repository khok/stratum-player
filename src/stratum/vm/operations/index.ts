import { Operation } from "vm-types";
import { Opcode } from "~/helpers/vmConstants";
import { initAdvanced } from "./advanced";
import { initBase } from "./base";
import { initGraphics } from "./graphics";
import { initSystem } from "./system";
import { initTools } from "./tools";
import { initWindows } from "./windows";

export const VmOperations = new Array<Operation>(Opcode.VM_MAXIMUM_code + 1);

(function() {
    function addOperation(opcode: number, operation: Operation) {
        if (VmOperations[opcode]) throw "Operation already set: " + opcode;
        VmOperations[opcode] = operation;
    }

    initAdvanced(addOperation);
    initBase(addOperation);
    initGraphics(addOperation);
    initSystem(addOperation);
    initTools(addOperation);
    initWindows(addOperation);
})();
