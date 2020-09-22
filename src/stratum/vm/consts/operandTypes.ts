import { OperationArgType } from "../types";
import { OpCode } from "./opCode";

export const operandTypes = new Array<OperationArgType>(OpCode.VM_MAXIMUM_code);

(function () {
    function setOperand(opcode: number, operandType: OperationArgType) {
        if (operandTypes[opcode]) throw "Operand already set: " + opcode;
        operandTypes[opcode] = operandType;
    }

    setOperand(OpCode.PUSH_FLOAT_const, "double");
    setOperand(OpCode.vmPUSH_LONG_const, "long");
    setOperand(OpCode.PUSH_STRING_CONST, "string");

    setOperand(OpCode.V_JMP, "codepoint");
    setOperand(OpCode.V_JNZ, "codepoint");
    setOperand(OpCode.V_JZ, "codepoint");
    setOperand(OpCode.V_JNZ_HANDLE, "codepoint");
    setOperand(OpCode.V_JZ_HANDLE, "codepoint");

    setOperand(OpCode.PUSH_FLOAT, "varId");
    setOperand(OpCode._PUSH_FLOAT, "varId");
    setOperand(OpCode._POP_FLOAT, "varId");
    setOperand(OpCode._POP_FLOAT_OLD, "varId");

    setOperand(OpCode.vmPUSH_LONG, "varId");
    setOperand(OpCode.vm_PUSH_LONG, "varId");
    setOperand(OpCode.vm_POP_LONG, "varId");
    setOperand(OpCode.vm_POP_LONG_OLD, "varId");

    setOperand(OpCode.PUSH_STRING, "varId");
    setOperand(OpCode._PUSH_STRING, "varId");
    setOperand(OpCode._POP_STRING, "varId");
    setOperand(OpCode._POP_STRING_OLD, "varId");

    setOperand(OpCode.PUSHPTR, "varId");
    setOperand(OpCode.PUSHPTRNEW, "varId");

    setOperand(OpCode.V_SYSTEM, "argCount");
    setOperand(OpCode.CREATEGROUP2D, "argCount");
    setOperand(OpCode.VM_SENDMESSAGE, "argCount");
    setOperand(OpCode.SETGROUPITEMS2D, "argCount");
    setOperand(OpCode.CREATEPOLYLINE2D, "argCount");
    setOperand(OpCode.VM_ADDPRIMITIVE3D, "argCount");

    setOperand(OpCode.VFUNCTION, "funcSignature");
    setOperand(OpCode.DLLFUNCTION, "dllFuncSignature");
})();
