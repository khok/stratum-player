import { OpCode } from "../consts";
import { Operation } from "../types";
import { initAdvanced } from "./advanced";
import { initBase } from "./base";
import { initGraphics } from "./gspace";
import { initGraphicObjects } from "./gspaceObjects";
import { initGraphicTools } from "./gspaceTools";
import { initMatrix } from "./matrix";
import { initMultimedia } from "./multimedia";
import { initSystem } from "./system";
import { initWindows } from "./windows";

export const operations = new Array<Operation>(OpCode.VM_MAXIMUM_code);

(function () {
    function addOperation(opcode: number, operation: Operation) {
        if (operations[opcode]) throw "Operation already set: " + opcode;
        operations[opcode] = operation;
    }

    initAdvanced(addOperation);
    initBase(addOperation);
    initGraphics(addOperation);
    initGraphicObjects(addOperation);
    initGraphicTools(addOperation);
    initMatrix(addOperation);
    initMultimedia(addOperation);
    initSystem(addOperation);
    initWindows(addOperation);
})();
