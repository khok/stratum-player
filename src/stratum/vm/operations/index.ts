import { Operation } from "vm-types";
import { Opcode } from "~/helpers/vmConstants";
import { initAdvanced } from "./advanced";
import { initBase } from "./base";
import { initGraphics } from "./gspace";
import { initGraphicObjects } from "./gspaceObjects";
import { initGraphicTools } from "./gspaceTools";
import { initSystem } from "./system";
import { initWindows } from "./windows";

export const VmOperations = new Array<Operation>(Opcode.VM_MAXIMUM_code + 1);

(function () {
    function addOperation(opcode: number, operation: Operation) {
        if (VmOperations[opcode]) throw "Operation already set: " + opcode;
        VmOperations[opcode] = operation;
    }

    initAdvanced(addOperation);
    initBase(addOperation);
    initGraphics(addOperation);
    initGraphicObjects(addOperation);
    initGraphicTools(addOperation);
    initSystem(addOperation);
    initWindows(addOperation);
})();
