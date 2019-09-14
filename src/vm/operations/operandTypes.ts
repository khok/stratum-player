import { Opcode } from "../opcode";
import { OperandType } from "../types";

export function initOperands(addOperand: (opcode: number, type: OperandType) => void) {
    //Base
    addOperand(Opcode.PUSH_FLOAT_const, "double");
    addOperand(Opcode.vmPUSH_LONG_const, "uint");
    addOperand(Opcode.PUSH_STRING_CONST, "string");
    addOperand(Opcode.V_JMP, "codepoint");
    addOperand(Opcode.V_JNZ, "codepoint");
    addOperand(Opcode.V_JZ, "codepoint");
    addOperand(Opcode.V_JNZ_HANDLE, "codepoint");
    addOperand(Opcode.V_JZ_HANDLE, "codepoint");

    addOperand(Opcode.PUSH_FLOAT, "varId");
    addOperand(Opcode._PUSH_FLOAT, "varId");
    addOperand(Opcode._POP_FLOAT, "varId");
    addOperand(Opcode._POP_FLOAT_OLD, "varId");
    addOperand(Opcode.vmPUSH_LONG, "varId");
    addOperand(Opcode.vm_PUSH_LONG, "varId");
    addOperand(Opcode.vm_POP_LONG, "varId");
    addOperand(Opcode.PUSH_STRING, "varId");
    addOperand(Opcode._PUSH_STRING, "varId");
    addOperand(Opcode._POP_STRING, "varId");

    //Advanced
    //                       o
    //                      /|\
    //                       |\
    addOperand(Opcode.VFUNCTION, "functionData");
    addOperand(Opcode.DLLFUNCTION, "dllFunctionData");
    addOperand(Opcode.CREATEGROUP2D, "word");
    addOperand(Opcode.VM_SENDMESSAGE, "word");
    addOperand(Opcode.SETGROUPITEMS2D, "word");
    addOperand(Opcode.CREATEPOLYLINE2D, "word");
    addOperand(Opcode.VM_ADDPRIMITIVE3D, "word");
}
