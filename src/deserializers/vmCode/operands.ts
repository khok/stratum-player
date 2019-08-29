import { Opcode } from "../../vm";

export enum OperandType {
    none,
    double,
    uint,
    string,
    codepoint,
    varId,
    word,
    function_ptr,
    dll_function
}

export const operandTypes = new Array<OperandType>(Opcode.VM_MAXIMUM_code + 1).fill(OperandType.none);
(function() {
    function addOperand(opcode: number, operandType: OperandType) {
        if (operandType === undefined) throw "Command argument undefined: " + Opcode[opcode];
        if (operandTypes[opcode] !== OperandType.none) throw "Command argument already exist: " + Opcode[opcode];
        operandTypes[opcode] = operandType;
    }

    //Base
    addOperand(Opcode.PUSH_FLOAT_const, OperandType.double);
    addOperand(Opcode.vmPUSH_LONG_const, OperandType.uint);
    addOperand(Opcode.PUSH_STRING_CONST, OperandType.string);
    addOperand(Opcode.V_JMP, OperandType.codepoint);
    addOperand(Opcode.V_JNZ, OperandType.codepoint);
    addOperand(Opcode.V_JZ, OperandType.codepoint);
    addOperand(Opcode.V_JNZ_HANDLE, OperandType.codepoint);
    addOperand(Opcode.V_JZ_HANDLE, OperandType.codepoint);

    addOperand(Opcode.PUSH_FLOAT, OperandType.varId);
    addOperand(Opcode._PUSH_FLOAT, OperandType.varId);
    addOperand(Opcode._POP_FLOAT, OperandType.varId);
    addOperand(Opcode._POP_FLOAT_OLD, OperandType.varId);
    addOperand(Opcode.vmPUSH_LONG, OperandType.varId);
    addOperand(Opcode.vm_PUSH_LONG, OperandType.varId);
    addOperand(Opcode.vm_POP_LONG, OperandType.varId);
    addOperand(Opcode.PUSH_STRING, OperandType.varId);
    addOperand(Opcode._PUSH_STRING, OperandType.varId);
    addOperand(Opcode._POP_STRING, OperandType.varId);

    //Advanced
    //                       o
    //                      /|\
    //                       |\
    addOperand(Opcode.VFUNCTION, OperandType.function_ptr);
    addOperand(Opcode.DLLFUNCTION, OperandType.dll_function);
    addOperand(Opcode.CREATEGROUP2D, OperandType.word);
    addOperand(Opcode.VM_SENDMESSAGE, OperandType.word);
    addOperand(Opcode.SETGROUPITEMS2D, OperandType.word);
    addOperand(Opcode.CREATEPOLYLINE2D, OperandType.word);
    addOperand(Opcode.VM_ADDPRIMITIVE3D, OperandType.word);
})();
