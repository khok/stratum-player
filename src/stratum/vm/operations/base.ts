import { OpCode } from "../consts";
import { ExecutionContext } from "../executionContext";
import { Operation } from "../types";

//Float push
function PUSH_FLOAT(ctx: ExecutionContext, varId: number) {
    ctx.pushDouble(ctx.memoryManager.oldDoubleValues[ctx.classVars.globalIds[varId]]);
}
function _PUSH_FLOAT(ctx: ExecutionContext, varId: number) {
    ctx.pushDouble(ctx.memoryManager.newDoubleValues[ctx.classVars.globalIds[varId]]);
}

// function PUSH_FLOAT_PTR(ctx: ExecutionContext) {
//     throw "PUSH_FLOAT_PTR: не реализовано";
// }

//Float pop
function _POP_FLOAT(ctx: ExecutionContext, varId: number) {
    ctx.memoryManager.newDoubleValues[ctx.classVars.globalIds[varId]] = ctx.popDouble();
}
function _POP_FLOAT_OLD(ctx: ExecutionContext, varId: number) {
    ctx.memoryManager.oldDoubleValues[ctx.classVars.globalIds[varId]] = ctx.popDouble();
}
// function POP_FLOAT_PTR(ctx: ExecutionContext) {
//     throw "POP_FLOAT_PTR: не реализовано";
// }

//Long push
function vmPUSH_LONG(ctx: ExecutionContext, varId: number) {
    ctx.pushLong(ctx.memoryManager.oldLongValues[ctx.classVars.globalIds[varId]]);
}

function vm_PUSH_LONG(ctx: ExecutionContext, varId: number) {
    ctx.pushLong(ctx.memoryManager.newLongValues[ctx.classVars.globalIds[varId]]);
}

//Long pop
function vm_POP_LONG(ctx: ExecutionContext, varId: number) {
    ctx.memoryManager.newLongValues[ctx.classVars.globalIds[varId]] = ctx.popLong();
}

// function vm_POP_LONG_OLD(ctx: ExecutionContext) {
//     throw "vm_POP_LONG_OLD: не реализовано";
// }

//String push
function PUSH_STRING(ctx: ExecutionContext, varId: number) {
    ctx.pushString(ctx.memoryManager.oldStringValues[ctx.classVars.globalIds[varId]]);
}

function _PUSH_STRING(ctx: ExecutionContext, varId: number) {
    ctx.pushString(ctx.memoryManager.newStringValues[ctx.classVars.globalIds[varId]]);
}

//String pop
function _POP_STRING(ctx: ExecutionContext, varId: number) {
    ctx.memoryManager.newStringValues[ctx.classVars.globalIds[varId]] = ctx.popString();
}

// function _POP_STRING_OLD(ctx: ExecutionContext) {
//     throw "_POP_STRING_OLD: не реализовано";
// }

//Pointer push
function PUSHPTRNEW(ctx: ExecutionContext, varId: number) {
    ctx.pushLong(varId);
    ctx.pushLong(1);
}

function PUSHPTR(ctx: ExecutionContext, varId: number) {
    ctx.pushLong(varId);
    ctx.pushLong(0);
}

//push consts
function PUSH_FLOAT_const(ctx: ExecutionContext, doubleValue: number) {
    ctx.pushDouble(doubleValue);
}

function vmPUSH_LONG_const(ctx: ExecutionContext, uintValue: number) {
    ctx.pushLong(uintValue);
}

function PUSH_STRING_CONST(ctx: ExecutionContext, stringValue: string) {
    ctx.pushString(stringValue);
}

//Unconditional jump
function V_JMP(ctx: ExecutionContext, codepoint: number) {
    ctx.nextOpPointer = codepoint;
}

//Conditional jumps
function V_JNZ(ctx: ExecutionContext, codepoint: number) {
    if (ctx.popDouble() !== 0) ctx.nextOpPointer = codepoint;
}
//if(cond === true){} <-- if not - jump to block end
function V_JZ(ctx: ExecutionContext, codepoint: number) {
    if (ctx.popDouble() === 0) ctx.nextOpPointer = codepoint;
}
function V_JNZ_HANDLE(ctx: ExecutionContext, codepoint: number) {
    if (ctx.popLong() !== 0) ctx.nextOpPointer = codepoint;
}
function V_JZ_HANDLE(ctx: ExecutionContext, codepoint: number) {
    if (ctx.popLong() === 0) ctx.nextOpPointer = codepoint;
}

function FLOAT_TO_LONG(ctx: ExecutionContext) {
    ctx.pushLong(ctx.popDouble());
}
function LONG_TO_FLOAT(ctx: ExecutionContext) {
    ctx.pushDouble(ctx.popLong());
}

function V_SIN(ctx: ExecutionContext) {
    ctx.pushDouble(Math.sin(ctx.popDouble()));
}
function V_COS(ctx: ExecutionContext) {
    ctx.pushDouble(Math.cos(ctx.popDouble()));
}
// function V_ASIN(ctx: ExecutionContext) {
//     throw "V_ASIN: не реализовано";
// }
// function V_ACOS(ctx: ExecutionContext) {
//     throw "V_ACOS: не реализовано";
// }
// function V_ATAN(ctx: ExecutionContext) {
//     throw "V_ATAN: не реализовано";
// }
// function V_TAN(ctx: ExecutionContext) {
//     throw "V_TAN: не реализовано";
// }
// function V_EXP(ctx: ExecutionContext) {
//     throw "V_EXP: не реализовано";
// }
function V_SQRT(ctx: ExecutionContext) {
    const value = ctx.popDouble();
    ctx.pushDouble(Math.sqrt(value) || 0);
}
function V_SQR(ctx: ExecutionContext) {
    const value = ctx.popDouble();
    ctx.pushDouble(value * value);
}
// function V_ED(ctx: ExecutionContext) {
//     throw "V_ED: не реализовано";
// }
// function V_DELTA(ctx: ExecutionContext) {
//     throw "V_DELTA: не реализовано";
// }
function V_MUL_F(ctx: ExecutionContext) {
    ctx.pushDouble(ctx.popDouble() * ctx.popDouble());
}
function V_DIV_F(ctx: ExecutionContext) {
    const b = ctx.popDouble();
    const a = ctx.popDouble();
    ctx.pushDouble(b === 0 ? 0 : a / b);
}
function V_ADD_F(ctx: ExecutionContext) {
    ctx.pushDouble(ctx.popDouble() + ctx.popDouble());
}
function V_SUB_F(ctx: ExecutionContext) {
    const b = ctx.popDouble();
    const a = ctx.popDouble();
    ctx.pushDouble(a - b);
}

function V_MOD(ctx: ExecutionContext) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    ctx.pushDouble(x % y);
}
function V_LN(ctx: ExecutionContext) {
    ctx.pushDouble(Math.log(ctx.popDouble()));
}
function V_LG(ctx: ExecutionContext) {
    ctx.pushDouble(Math.log10(ctx.popDouble()));
}
// function V_LOG(ctx: ExecutionContext) {
//     throw "V_LOG: не реализовано";
//     // const value = ctx.popFloat();
//     // const base = ctx.popFloat();
//     //ctx.// pushFloat(log(value)/(base ? log(base) : 1));
// }
function V_STEPEN(ctx: ExecutionContext) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    ctx.pushDouble(Math.pow(x, y));
}
function V_MAX(ctx: ExecutionContext) {
    ctx.pushDouble(Math.max(ctx.popDouble(), ctx.popDouble()));
}
function V_MIN(ctx: ExecutionContext) {
    ctx.pushDouble(Math.min(ctx.popDouble(), ctx.popDouble()));
}
function V_AVERAGE(ctx: ExecutionContext) {
    ctx.pushDouble((ctx.popDouble() + ctx.popDouble()) / 2);
}
//округляет число arg1 с точностью arg2
function V_ROUND(ctx: ExecutionContext) {
    const dec = Math.pow(10, Math.floor(ctx.popDouble()));
    const value = ctx.popDouble();
    ctx.pushDouble(Math.round(value * dec) / dec);
}
function V_TRUNC(ctx: ExecutionContext) {
    ctx.pushDouble(Math.trunc(ctx.popDouble()));
}
function V_RANDOM(ctx: ExecutionContext) {
    ctx.pushDouble(ctx.popDouble() * Math.random());
}
function V_ABS(ctx: ExecutionContext) {
    ctx.pushDouble(Math.abs(ctx.popDouble()));
}
// function V_SGN(ctx: ExecutionContext) {
//     throw "V_SGN: не реализовано";
// }
// function V_RAD(ctx: ExecutionContext) {
//     throw "V_RAD: не реализовано";
// }
// function V_DEG(ctx: ExecutionContext) {
//     throw "V_DEG: не реализовано";
// }

function V_AND(ctx: ExecutionContext) {
    const a = ctx.popDouble() && 1;
    const b = ctx.popDouble() && 1;
    ctx.pushDouble(a && b);
}
function V_OR(ctx: ExecutionContext) {
    const a = ctx.popDouble() && 1;
    const b = ctx.popDouble() && 1;
    ctx.pushDouble(a || b);
}
function V_NOT(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popDouble() === 0));
}

// function V_STOP(ctx: ExecutionContext) {
//     throw "V_STOP: не реализовано";
// }
function V_UN_MINUS(ctx: ExecutionContext) {
    ctx.pushDouble(-ctx.popDouble());
}
function V_AND_BINARY(ctx: ExecutionContext) {
    ctx.pushDouble(ctx.popDouble() & ctx.popDouble());
}
function V_OR_BINARY(ctx: ExecutionContext) {
    ctx.pushDouble(ctx.popDouble() | ctx.popDouble());
}
// function V_SHR(ctx: ExecutionContext) {
//     throw "V_SHR: не реализовано";
// }
// function V_SHL(ctx: ExecutionContext) {
//     throw "V_SHL: не реализовано";
// }
function V_EQUAL(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popDouble() === ctx.popDouble()));
}
function V_NOTEQUAL(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popDouble() !== ctx.popDouble()));
}
function V_MORE(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popDouble() < ctx.popDouble()));
}
function V_MOREorEQUAL(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popDouble() <= ctx.popDouble()));
}
function V_LOW(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popDouble() > ctx.popDouble()));
}
function V_LOWorEQUAL(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popDouble() >= ctx.popDouble()));
}
function S_EQUAL(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popString() === ctx.popString()));
}
function S_NOTEQUAL(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popString() !== ctx.popString()));
}
function S_MORE(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popString() < ctx.popString()));
}
function S_MOREorEQUAL(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popString() <= ctx.popString()));
}
function S_LOW(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popString() > ctx.popString()));
}
function S_LOWorEQUAL(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popString() >= ctx.popString()));
}

function V_EQUALI(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popLong() === ctx.popLong()));
}
function V_NOTEQUALI(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popLong() !== ctx.popLong()));
}

function V_EDI(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popLong() > 0));
}
// function V_ANDI(ctx: ExecutionContext) {
//     throw "V_ANDI: не реализовано";
//     const a = ctx.popLong() && 1;
//     const b = ctx.popLong() && 1;
//     ctx.pushLong(a && b);
// }
// function V_ORI(ctx: ExecutionContext) {
//     throw "V_ORI: не реализовано";
//     const a = ctx.popLong() && 1;
//     const b = ctx.popLong() && 1;
//     ctx.pushLong(a || b);
// }
function V_NOTI(ctx: ExecutionContext) {
    ctx.pushDouble(Number(ctx.popLong() === 0));
}
// function V_NOTbin(ctx: ExecutionContext) {
//     throw "V_NOTbin: не реализовано";
// }

function SCHANGE(ctx: ExecutionContext) {
    const s3 = ctx.popString();
    const s2 = ctx.popString();
    const s1 = ctx.popString();
    ctx.pushString(s1.replace(new RegExp(s2, "g"), s3));
}
function PLUS_STRING(ctx: ExecutionContext) {
    const b = ctx.popString();
    const a = ctx.popString();
    ctx.pushString(a + b);
}
function LEFT_STRING(ctx: ExecutionContext) {
    const count = ctx.popDouble();
    const str = ctx.popString();
    ctx.pushString(str.substr(0, count));
}
function RIGHT_STRING(ctx: ExecutionContext) {
    const count = ctx.popDouble();
    const str = ctx.popString();
    ctx.pushString(str.substr(str.length - count, count));
}
// STRING Substr(STRING str, FLOAT pos, FLOAT n)
function SUBSTR_STRING(ctx: ExecutionContext) {
    const length = ctx.popDouble();
    const from = ctx.popDouble();
    const str = ctx.popString();
    ctx.pushString(str.substr(from, length));
}
// function POS_STRING(ctx: ExecutionContext) {
//     throw "POS_STRING: не реализовано";
// }
// function REPLICATE_STRING(ctx: ExecutionContext) {
//     throw "REPLICATE_STRING: не реализовано";
// }
// function LOWER_STRING(ctx: ExecutionContext) {
//     throw "LOWER_STRING: не реализовано";
// }
// function UPPER_STRING(ctx: ExecutionContext) {
//     throw "UPPER_STRING: не реализовано";
// }
// function ANSI_TO_OEM_STRING(ctx: ExecutionContext) {
//     throw "ANSI_TO_OEM_STRING: не реализовано";
// }
// function OEM_TO_ANSI_STRING(ctx: ExecutionContext) {
//     throw "OEM_TO_ANSI_STRING: не реализовано";
// }
// function COMPARE_STRING(ctx: ExecutionContext) {
//     throw "COMPARE_STRING: не реализовано";
// }
// function COMPAREI_STRING(ctx: ExecutionContext) {
//     throw "COMPAREI_STRING: не реализовано";
// }
function LENGTH_STRING(ctx: ExecutionContext) {
    ctx.pushDouble(ctx.popString().length);
}
// function LTRIM_STRING(ctx: ExecutionContext) {
//     throw "LTRIM_STRING: не реализовано";
// }
// function RTRIM_STRING(ctx: ExecutionContext) {
//     throw "RTRIM_STRING: не реализовано";
// }
// function ALLTRIM_STRING(ctx: ExecutionContext) {
//     throw "ALLTRIM_STRING: не реализовано";
// }
// function ASCII_STRING(ctx: ExecutionContext) {
//     throw "ASCII_STRING: не реализовано";
// }
function CHR_STRING(ctx: ExecutionContext) {
    ctx.pushString(String.fromCharCode(ctx.popDouble()));
}

function STRING_TO_FLOAT(ctx: ExecutionContext) {
    ctx.pushDouble(parseFloat(ctx.popString()) || 0);
}

function floatToString(float: number) {
    return (Math.round(float * 100000) / 100000).toString();
}

function FLOAT_TO_STRING(ctx: ExecutionContext) {
    ctx.pushString(floatToString(ctx.popDouble()));
}
function PLUS_STRING_FLOAT(ctx: ExecutionContext) {
    const b = floatToString(ctx.popDouble());
    const a = ctx.popString();
    ctx.pushString(a + b);
}
function PLUS_FLOAT_STRING(ctx: ExecutionContext) {
    const b = ctx.popString();
    const a = floatToString(ctx.popDouble());
    ctx.pushString(a + b);
}

export function initBase(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(OpCode.PUSH_FLOAT, PUSH_FLOAT as Operation);
    addOperation(OpCode._PUSH_FLOAT, _PUSH_FLOAT as Operation);
    addOperation(OpCode.PUSH_FLOAT_const, PUSH_FLOAT_const as Operation);
    // addOperation(OpCode.PUSH_FLOAT_PTR, PUSH_FLOAT_PTR as Operation);
    addOperation(OpCode._POP_FLOAT, _POP_FLOAT as Operation);
    addOperation(OpCode._POP_FLOAT_OLD, _POP_FLOAT_OLD as Operation);
    // addOperation(OpCode.POP_FLOAT_PTR, POP_FLOAT_PTR as Operation);
    addOperation(OpCode.vmPUSH_LONG, vmPUSH_LONG as Operation);
    addOperation(OpCode.vmPUSH_LONG_const, vmPUSH_LONG_const as Operation);
    addOperation(OpCode.vm_PUSH_LONG, vm_PUSH_LONG as Operation);
    addOperation(OpCode.vm_POP_LONG, vm_POP_LONG as Operation);
    // addOperation(OpCode.vm_POP_LONG_OLD, vm_POP_LONG_OLD);
    addOperation(OpCode.PUSH_STRING, PUSH_STRING as Operation);
    addOperation(OpCode._PUSH_STRING, _PUSH_STRING as Operation);
    addOperation(OpCode.PUSH_STRING_CONST, PUSH_STRING_CONST as Operation);
    addOperation(OpCode._POP_STRING, _POP_STRING as Operation);
    addOperation(OpCode.V_JMP, V_JMP as Operation);
    addOperation(OpCode.V_JNZ, V_JNZ as Operation);
    addOperation(OpCode.V_JZ, V_JZ as Operation);
    addOperation(OpCode.V_JNZ_HANDLE, V_JNZ_HANDLE as Operation);
    addOperation(OpCode.V_JZ_HANDLE, V_JZ_HANDLE as Operation);
    addOperation(OpCode.PUSHPTRNEW, PUSHPTRNEW as Operation);
    addOperation(OpCode.PUSHPTR, PUSHPTR as Operation);

    addOperation(OpCode.FLOAT_TO_LONG, FLOAT_TO_LONG);
    addOperation(OpCode.LONG_TO_FLOAT, LONG_TO_FLOAT);
    // addOperation(OpCode._POP_STRING_OLD, _POP_STRING_OLD);
    addOperation(OpCode.V_SIN, V_SIN);
    addOperation(OpCode.V_COS, V_COS);
    // addOperation(OpCode.V_ASIN, V_ASIN);
    // addOperation(OpCode.V_ACOS, V_ACOS);
    // addOperation(OpCode.V_ATAN, V_ATAN);
    // addOperation(OpCode.V_TAN, V_TAN);
    // addOperation(OpCode.V_EXP, V_EXP);
    addOperation(OpCode.V_SQRT, V_SQRT);
    addOperation(OpCode.V_SQR, V_SQR);
    // addOperation(OpCode.V_ED, V_ED);
    // addOperation(OpCode.V_DELTA, V_DELTA);
    addOperation(OpCode.V_MUL_F, V_MUL_F);
    addOperation(OpCode.V_DIV_F, V_DIV_F);
    addOperation(OpCode.V_ADD_F, V_ADD_F);
    addOperation(OpCode.V_SUB_F, V_SUB_F);
    // addOperation(OpCode.V_BIG_SUB, V_SUB_F);
    addOperation(OpCode.V_MOD, V_MOD);
    addOperation(OpCode.V_LN, V_LN);
    addOperation(OpCode.V_LG, V_LG);
    // addOperation(OpCode.V_LOG, V_LOG);
    addOperation(OpCode.V_STEPEN, V_STEPEN);
    addOperation(OpCode.V_MAX, V_MAX);
    addOperation(OpCode.V_MIN, V_MIN);
    addOperation(OpCode.V_AVERAGE, V_AVERAGE);
    addOperation(OpCode.V_ROUND, V_ROUND);
    addOperation(OpCode.V_TRUNC, V_TRUNC);
    addOperation(OpCode.V_RANDOM, V_RANDOM);
    addOperation(OpCode.V_ABS, V_ABS);
    // addOperation(OpCode.V_SGN, V_SGN);
    // addOperation(OpCode.V_RAD, V_RAD);
    // addOperation(OpCode.V_DEG, V_DEG);
    addOperation(OpCode.V_AND, V_AND);
    addOperation(OpCode.V_OR, V_OR);
    addOperation(OpCode.V_NOT, V_NOT);
    // addOperation(OpCode.V_STOP, V_STOP);
    addOperation(OpCode.V_UN_MINUS, V_UN_MINUS);
    addOperation(OpCode.V_AND_BINARY, V_AND_BINARY);
    addOperation(OpCode.V_OR_BINARY, V_OR_BINARY);
    // addOperation(OpCode.V_SHR, V_SHR);
    // addOperation(OpCode.V_SHL, V_SHL);
    addOperation(OpCode.V_EQUAL, V_EQUAL);
    addOperation(OpCode.V_NOTEQUAL, V_NOTEQUAL);
    addOperation(OpCode.V_MORE, V_MORE);
    addOperation(OpCode.V_MOREorEQUAL, V_MOREorEQUAL);
    addOperation(OpCode.V_LOW, V_LOW);
    addOperation(OpCode.V_LOWorEQUAL, V_LOWorEQUAL);
    addOperation(OpCode.S_EQUAL, S_EQUAL);
    addOperation(OpCode.S_NOTEQUAL, S_NOTEQUAL);
    addOperation(OpCode.S_MORE, S_MORE);
    addOperation(OpCode.S_MOREorEQUAL, S_MOREorEQUAL);
    addOperation(OpCode.S_LOW, S_LOW);
    addOperation(OpCode.S_LOWorEQUAL, S_LOWorEQUAL);
    addOperation(OpCode.V_EQUALI, V_EQUALI);
    addOperation(OpCode.V_NOTEQUALI, V_NOTEQUALI);
    addOperation(OpCode.V_EDI, V_EDI);
    // addOperation(OpCode.V_ANDI, V_ANDI);
    // addOperation(OpCode.V_ORI, V_ORI);
    addOperation(OpCode.V_NOTI, V_NOTI);
    // addOperation(OpCode.V_NOTbin, V_NOTbin);
    addOperation(OpCode.SCHANGE, SCHANGE);
    addOperation(OpCode.PLUS_STRING, PLUS_STRING);
    addOperation(OpCode.LEFT_STRING, LEFT_STRING);
    addOperation(OpCode.RIGHT_STRING, RIGHT_STRING);
    addOperation(OpCode.SUBSTR_STRING, SUBSTR_STRING);
    // addOperation(OpCode.POS_STRING, POS_STRING);
    // addOperation(OpCode.REPLICATE_STRING, REPLICATE_STRING);
    // addOperation(OpCode.LOWER_STRING, LOWER_STRING);
    // addOperation(OpCode.UPPER_STRING, UPPER_STRING);
    // addOperation(OpCode.ANSI_TO_OEM_STRING, ANSI_TO_OEM_STRING);
    // addOperation(OpCode.OEM_TO_ANSI_STRING, OEM_TO_ANSI_STRING);
    // addOperation(OpCode.COMPARE_STRING, COMPARE_STRING);
    // addOperation(OpCode.COMPAREI_STRING, COMPAREI_STRING);
    addOperation(OpCode.LENGTH_STRING, LENGTH_STRING);
    // addOperation(OpCode.LTRIM_STRING, LTRIM_STRING);
    // addOperation(OpCode.RTRIM_STRING, RTRIM_STRING);
    // addOperation(OpCode.ALLTRIM_STRING, ALLTRIM_STRING);
    // addOperation(OpCode.ASCII_STRING, ASCII_STRING);
    addOperation(OpCode.CHR_STRING, CHR_STRING);
    addOperation(OpCode.STRING_TO_FLOAT, STRING_TO_FLOAT);
    addOperation(OpCode.FLOAT_TO_STRING, FLOAT_TO_STRING);
    addOperation(OpCode.PLUS_STRING_FLOAT, PLUS_STRING_FLOAT);
    addOperation(OpCode.PLUS_FLOAT_STRING, PLUS_FLOAT_STRING);
}
