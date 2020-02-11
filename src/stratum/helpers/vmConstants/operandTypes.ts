import { Opcode } from "./opcode";
import { OperandType } from "vm-types";

export const VmOperandTypes = new Array<OperandType | undefined>(Opcode.VM_MAXIMUM_code + 1);

(function() {
    function setOperand(opcode: number, operandType: OperandType) {
        if (VmOperandTypes[opcode]) throw "Operand already set: " + opcode;
        VmOperandTypes[opcode] = operandType;
    }
    //Base
    setOperand(Opcode.PUSH_FLOAT_const, "double");
    setOperand(Opcode.vmPUSH_LONG_const, "uint");
    setOperand(Opcode.PUSH_STRING_CONST, "string");
    setOperand(Opcode.V_JMP, "codepoint");
    setOperand(Opcode.V_JNZ, "codepoint");
    setOperand(Opcode.V_JZ, "codepoint");
    setOperand(Opcode.V_JNZ_HANDLE, "codepoint");
    setOperand(Opcode.V_JZ_HANDLE, "codepoint");

    setOperand(Opcode.PUSH_FLOAT, "varId");
    setOperand(Opcode._PUSH_FLOAT, "varId");
    setOperand(Opcode._POP_FLOAT, "varId");
    setOperand(Opcode._POP_FLOAT_OLD, "varId");
    setOperand(Opcode.vmPUSH_LONG, "varId");
    setOperand(Opcode.vm_PUSH_LONG, "varId");
    setOperand(Opcode.vm_POP_LONG, "varId");
    setOperand(Opcode.PUSH_STRING, "varId");
    setOperand(Opcode._PUSH_STRING, "varId");
    setOperand(Opcode._POP_STRING, "varId");

    //Advanced
    //                      o
    //                     /|\
    //                      |\
    setOperand(Opcode.V_SYSTEM, "word");
    setOperand(Opcode.VFUNCTION, "functionData");
    setOperand(Opcode.DLLFUNCTION, "dllFunctionData");
    setOperand(Opcode.CREATEGROUP2D, "word");
    setOperand(Opcode.VM_SENDMESSAGE, "word");
    setOperand(Opcode.SETGROUPITEMS2D, "word");
    setOperand(Opcode.CREATEPOLYLINE2D, "word");
    setOperand(Opcode.VM_ADDPRIMITIVE3D, "word");
})();
