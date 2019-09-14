import { Opcode } from "../opcode";
import { OperandType, Operation } from "../types";
import { initAdvanced } from "./advanced";
import { initBase } from "./base";
import { initGraphicSpace } from "./graphicSpace";
import { initOperands } from "./operandTypes";
import { initSystem } from "./system";
import { initWindows } from "./windows";

export const operations = new Array<Operation>(Opcode.VM_MAXIMUM_code + 1);
export const operandTypes = new Array<OperandType | undefined>(Opcode.VM_MAXIMUM_code + 1);

(function() {
    function addOperation(opcode: number, operation: Operation) {
        if (operations[opcode]) throw "Operation already set: " + opcode;
        operations[opcode] = operation;
    }

    function addOperand(opcode: number, operandType: OperandType) {
        if (operandTypes[opcode]) throw "Operand already set: " + opcode;
        operandTypes[opcode] = operandType;
    }

    initOperands(addOperand);
    initBase(addOperation);
    initWindows(addOperation);
    initAdvanced(addOperation);
    initGraphicSpace(addOperation);
    initSystem(addOperation);
})();
