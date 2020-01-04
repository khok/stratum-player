import { Operation } from "vm-types";
import { Opcode } from "~/helpers/vm";
import { initAdvanced } from "./advanced";
import { initBase } from "./base";
import { initGraphicSpace } from "./graphicSpace";
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
    initGraphicSpace(addOperation);
    initSystem(addOperation);
    initTools(addOperation);
    initWindows(addOperation);
})();
