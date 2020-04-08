import { Opcode } from "~/helpers/vmConstants";
import { VmStateContainer, Operation } from "vm-types";

function V_END(ctx: VmStateContainer) {}

//Float push
function PUSH_FLOAT(ctx: VmStateContainer, varId: number) {
    ctx.pushDouble(ctx.memoryState.oldDoubleValues[ctx.currentClass.doubleVarMappingArray![varId]]);
}
function _PUSH_FLOAT(ctx: VmStateContainer, varId: number) {
    ctx.pushDouble(ctx.memoryState.newDoubleValues[ctx.currentClass.doubleVarMappingArray![varId]]);
}

function PUSH_FLOAT_PTR(ctx: VmStateContainer) {
    throw "PUSH_FLOAT_PTR: NIMP";
}

//Float pop
function _POP_FLOAT(ctx: VmStateContainer, varId: number) {
    ctx.memoryState.newDoubleValues[ctx.currentClass.doubleVarMappingArray![varId]] = ctx.popDouble();
}
function _POP_FLOAT_OLD(ctx: VmStateContainer, varId: number) {
    ctx.memoryState.oldDoubleValues[ctx.currentClass.doubleVarMappingArray![varId]] = ctx.popDouble();
}
function POP_FLOAT_PTR(ctx: VmStateContainer) {
    throw "POP_FLOAT_PTR: NIMP";
}

//Long push
function vmPUSH_LONG(ctx: VmStateContainer, varId: number) {
    ctx.pushLong(ctx.memoryState.oldLongValues[ctx.currentClass.longVarMappingArray![varId]]);
}

function vm_PUSH_LONG(ctx: VmStateContainer, varId: number) {
    ctx.pushLong(ctx.memoryState.newLongValues[ctx.currentClass.longVarMappingArray![varId]]);
}

//Long pop
function vm_POP_LONG(ctx: VmStateContainer, varId: number) {
    ctx.memoryState.newLongValues[ctx.currentClass.longVarMappingArray![varId]] = ctx.popLong();
}

function vm_POP_LONG_OLD(ctx: VmStateContainer) {
    throw "vm_POP_LONG_OLD: NIMP";
}

//String push
function PUSH_STRING(ctx: VmStateContainer, varId: number) {
    ctx.pushString(ctx.memoryState.oldStringValues[ctx.currentClass.stringVarMappingArray![varId]]);
}

function _PUSH_STRING(ctx: VmStateContainer, varId: number) {
    ctx.pushString(ctx.memoryState.newStringValues[ctx.currentClass.stringVarMappingArray![varId]]);
}

//String pop
function _POP_STRING(ctx: VmStateContainer, varId: number) {
    ctx.memoryState.newStringValues[ctx.currentClass.stringVarMappingArray![varId]] = ctx.popString();
}

function _POP_STRING_OLD(ctx: VmStateContainer) {
    throw "_POP_STRING_OLD: NIMP";
}

//Pointer push
function PUSHPTRNEW(ctx: VmStateContainer, varId: number) {
    ctx.pushLong(varId);
    ctx.pushLong(1);
}

function PUSHPTR(ctx: VmStateContainer, varId: number) {
    ctx.pushLong(varId);
    ctx.pushLong(0);
}

//push consts
function PUSH_FLOAT_const(ctx: VmStateContainer, doubleValue: number) {
    ctx.pushDouble(doubleValue);
}

function vmPUSH_LONG_const(ctx: VmStateContainer, uintValue: number) {
    ctx.pushLong(uintValue);
}

function PUSH_STRING_CONST(ctx: VmStateContainer, stringValue: string) {
    ctx.pushString(stringValue);
}

//Unconditional jump
function V_JMP(ctx: VmStateContainer, codepoint: number) {
    ctx.jumpTo(codepoint);
}

//Conditional jumps
function V_JNZ(ctx: VmStateContainer, codepoint: number) {
    if (ctx.popDouble()) ctx.jumpTo(codepoint);
}
//if(cond === true){} <-- if not - jump to block end
function V_JZ(ctx: VmStateContainer, codepoint: number) {
    if (!ctx.popDouble()) ctx.jumpTo(codepoint);
}
function V_JNZ_HANDLE(ctx: VmStateContainer, codepoint: number) {
    if (ctx.popLong()) ctx.jumpTo(codepoint);
}
function V_JZ_HANDLE(ctx: VmStateContainer, codepoint: number) {
    if (!ctx.popLong()) ctx.jumpTo(codepoint);
}

function FLOAT_TO_LONG(ctx: VmStateContainer) {
    ctx.pushLong(ctx.popDouble());
}
function LONG_TO_FLOAT(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.popLong());
}

function GETTICKCOUNT(ctx: VmStateContainer) {
    throw "GETTICKCOUNT: NIMP";
}
function V_SIN(ctx: VmStateContainer) {
    ctx.pushDouble(Math.sin(ctx.popDouble()));
}
function V_COS(ctx: VmStateContainer) {
    ctx.pushDouble(Math.cos(ctx.popDouble()));
}
function V_ASIN(ctx: VmStateContainer) {
    throw "V_ASIN: NIMP";
}
function V_ACOS(ctx: VmStateContainer) {
    throw "V_ACOS: NIMP";
}
function V_ATAN(ctx: VmStateContainer) {
    throw "V_ATAN: NIMP";
}
function V_TAN(ctx: VmStateContainer) {
    throw "V_TAN: NIMP";
}
function V_EXP(ctx: VmStateContainer) {
    throw "V_EXP: NIMP";
}
function V_SQRT(ctx: VmStateContainer) {
    const value = ctx.popDouble();
    ctx.pushDouble(Math.sqrt(value) || 0);
}
function V_SQR(ctx: VmStateContainer) {
    throw "V_SQR: NIMP";
}
function V_ED(ctx: VmStateContainer) {
    throw "V_ED: NIMP";
}
function V_DELTA(ctx: VmStateContainer) {
    throw "V_DELTA: NIMP";
}
function V_MUL_F(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.popDouble() * ctx.popDouble());
}
function V_DIV_F(ctx: VmStateContainer) {
    const b = ctx.popDouble();
    const a = ctx.popDouble();
    ctx.pushDouble(b === 0 ? 0 : a / b);
}
function V_ADD_F(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.popDouble() + ctx.popDouble());
}
function V_SUB_F(ctx: VmStateContainer) {
    const b = ctx.popDouble();
    const a = ctx.popDouble();
    ctx.pushDouble(a - b);
}
// function V_BIG_SUB : VmStateContainer (ctx) {
//     throw 'V_BIG_SUB: NIMP'
// }
function V_MOD(ctx: VmStateContainer) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    ctx.pushDouble(x % y);
}
function V_LN(ctx: VmStateContainer) {
    ctx.pushDouble(Math.log(ctx.popDouble()));
}
function V_LG(ctx: VmStateContainer) {
    ctx.pushDouble(Math.log10(ctx.popDouble()));
}
function V_LOG(ctx: VmStateContainer) {
    throw "V_LOG: NIMP";
    // const value = ctx.popFloat();
    // const base = ctx.popFloat();
    //ctx.// pushFloat(log(value)/(base ? log(base) : 1));
}
function V_STEPEN(ctx: VmStateContainer) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    ctx.pushDouble(Math.pow(x, y));
}
function V_MAX(ctx: VmStateContainer) {
    ctx.pushDouble(Math.max(ctx.popDouble(), ctx.popDouble()));
}
function V_MIN(ctx: VmStateContainer) {
    ctx.pushDouble(Math.min(ctx.popDouble(), ctx.popDouble()));
}
function V_AVERAGE(ctx: VmStateContainer) {
    ctx.pushDouble((ctx.popDouble() + ctx.popDouble()) / 2);
}
function V_ROUND(ctx: VmStateContainer) {
    const dec = Math.pow(10, Math.floor(ctx.popDouble()));
    const value = ctx.popDouble();
    ctx.pushDouble(Math.round(value * dec) / dec);
}
function V_TRUNC(ctx: VmStateContainer) {
    ctx.pushDouble(Math.trunc(ctx.popDouble()));
}
function V_RANDOM(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.popDouble() * Math.random());
}
function V_ABS(ctx: VmStateContainer) {
    ctx.pushDouble(Math.abs(ctx.popDouble()));
}
function V_SGN(ctx: VmStateContainer) {
    throw "V_SGN: NIMP";
}
function V_RAD(ctx: VmStateContainer) {
    throw "V_RAD: NIMP";
}
function V_DEG(ctx: VmStateContainer) {
    throw "V_DEG: NIMP";
}

function V_AND(ctx: VmStateContainer) {
    const a = ctx.popDouble();
    const b = ctx.popDouble();
    ctx.pushDouble(a && b);
}
function V_OR(ctx: VmStateContainer) {
    const a = ctx.popDouble();
    const b = ctx.popDouble();
    ctx.pushDouble(a || b);
}
function V_NOT(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popDouble() === 0));
}

function V_STOP(ctx: VmStateContainer) {
    throw "V_STOP: NIMP";
}
function V_UN_MINUS(ctx: VmStateContainer) {
    ctx.pushDouble(-ctx.popDouble());
}
function V_AND_BINARY(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.popDouble() & ctx.popDouble());
}
function V_OR_BINARY(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.popDouble() | ctx.popDouble());
}
function V_SHR(ctx: VmStateContainer) {
    throw "V_SHR: NIMP";
}
function V_SHL(ctx: VmStateContainer) {
    throw "V_SHL: NIMP";
}
function V_EQUAL(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popDouble() === ctx.popDouble()));
}
function V_NOTEQUAL(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popDouble() !== ctx.popDouble()));
}
function V_MORE(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popDouble() < ctx.popDouble()));
}
function V_MOREorEQUAL(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popDouble() <= ctx.popDouble()));
}
function V_LOW(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popDouble() > ctx.popDouble()));
}
function V_LOWorEQUAL(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popDouble() >= ctx.popDouble()));
}
function S_EQUAL(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popString() === ctx.popString()));
}
function S_NOTEQUAL(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popString() !== ctx.popString()));
}
function S_MORE(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popString() < ctx.popString()));
}
function S_MOREorEQUAL(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popString() <= ctx.popString()));
}
function S_LOW(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popString() > ctx.popString()));
}
function S_LOWorEQUAL(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popString() >= ctx.popString()));
}

function V_EQUALI(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popLong() === ctx.popLong()));
}
function V_NOTEQUALI(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popLong() !== ctx.popLong()));
}

function V_EDI(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popLong() > 0));
}
function V_ANDI(ctx: VmStateContainer) {
    const a = ctx.popLong();
    const b = ctx.popLong();
    ctx.pushLong(a && b);
}
function V_ORI(ctx: VmStateContainer) {
    const a = ctx.popLong();
    const b = ctx.popLong();
    ctx.pushLong(a || b);
}
function V_NOTI(ctx: VmStateContainer) {
    ctx.pushDouble(Number(ctx.popLong() === 0));
}
function V_NOTbin(ctx: VmStateContainer) {
    throw "V_NOTbin: NIMP";
}

function V_MCREATE(ctx: VmStateContainer) {
    throw "V_MCREATE: NIMP";
}
function V_MDELETE(ctx: VmStateContainer) {
    throw "V_MDELETE: NIMP";
}
function V_MFILL(ctx: VmStateContainer) {
    throw "V_MFILL: NIMP";
}
function V_MGET(ctx: VmStateContainer) {
    throw "V_MGET: NIMP";
}
function V_MPUT(ctx: VmStateContainer) {
    throw "V_MPUT: NIMP";
}
function V_MEDITOR(ctx: VmStateContainer) {
    throw "V_MEDITOR: NIMP";
}
function V_MDIAG(ctx: VmStateContainer) {
    throw "V_MDIAG: NIMP";
}
function V_MADDX(ctx: VmStateContainer) {
    throw "V_MADDX: NIMP";
}
function V_MSUBX(ctx: VmStateContainer) {
    throw "V_MSUBX: NIMP";
}
function V_MDET(ctx: VmStateContainer) {
    throw "V_MDET: NIMP";
}
function V_MDELTA(ctx: VmStateContainer) {
    throw "V_MDELTA: NIMP";
}
function V_MED(ctx: VmStateContainer) {
    throw "V_MED: NIMP";
}
function V_MDIVX(ctx: VmStateContainer) {
    throw "V_MDIVX: NIMP";
}
function V_MMULX(ctx: VmStateContainer) {
    throw "V_MMULX: NIMP";
}
function V_TRANSP(ctx: VmStateContainer) {
    throw "V_TRANSP: NIMP";
}
function V_MADDC(ctx: VmStateContainer) {
    throw "V_MADDC: NIMP";
}
function V_MNOT(ctx: VmStateContainer) {
    throw "V_MNOT: NIMP";
}
function V_MSUM(ctx: VmStateContainer) {
    throw "V_MSUM: NIMP";
}

function V_MSUBC(ctx: VmStateContainer) {
    throw "V_MSUBC: NIMP";
}
function V_MMULC(ctx: VmStateContainer) {
    throw "V_MMULC: NIMP";
}

function V_MDIVC(ctx: VmStateContainer) {
    throw "V_MDIVC: NIMP";
}
function V_MMUL(ctx: VmStateContainer) {
    throw "V_MMUL: NIMP";
}
function V_MGLUE(ctx: VmStateContainer) {
    throw "V_MGLUE: NIMP";
}
function V_MCUT(ctx: VmStateContainer) {
    throw "V_MCUT: NIMP";
}
function V_MMOVE(ctx: VmStateContainer) {
    throw "V_MMOVE: NIMP";
}
function V_MOBR(ctx: VmStateContainer) {
    throw "V_MOBR: NIMP";
}

function V_MLOAD(ctx: VmStateContainer) {
    throw "V_MLOAD: NIMP";
}
function V_MSAVEAS(ctx: VmStateContainer) {
    throw "V_MSAVEAS: NIMP";
}
function V_MDIM(ctx: VmStateContainer) {
    throw "V_MDIM: NIMP";
}

function SCHANGE(ctx: VmStateContainer) {
    const s3 = ctx.popString();
    const s2 = ctx.popString();
    const s1 = ctx.popString();
    ctx.pushString(s1.replace(s2, s3));
}
function PLUS_STRING(ctx: VmStateContainer) {
    const b = ctx.popString();
    const a = ctx.popString();
    ctx.pushString(a + b);
}
function LEFT_STRING(ctx: VmStateContainer) {
    const count = ctx.popDouble();
    const str = ctx.popString();
    ctx.pushString(str.substr(0, count));
}
function RIGHT_STRING(ctx: VmStateContainer) {
    const count = ctx.popDouble();
    const str = ctx.popString();
    ctx.pushString(str.substr(str.length - count, count));
}
// STRING Substr(STRING str, FLOAT pos, FLOAT n)
function SUBSTR_STRING(ctx: VmStateContainer) {
    const length = ctx.popDouble();
    const from = ctx.popDouble();
    const str = ctx.popString();
    ctx.pushString(str.substr(from, length));
}
function POS_STRING(ctx: VmStateContainer) {
    throw "POS_STRING: NIMP";
}
function REPLICATE_STRING(ctx: VmStateContainer) {
    throw "REPLICATE_STRING: NIMP";
}
function LOWER_STRING(ctx: VmStateContainer) {
    throw "LOWER_STRING: NIMP";
}
function UPPER_STRING(ctx: VmStateContainer) {
    throw "UPPER_STRING: NIMP";
}
function ANSI_TO_OEM_STRING(ctx: VmStateContainer) {
    throw "ANSI_TO_OEM_STRING: NIMP";
}
function OEM_TO_ANSI_STRING(ctx: VmStateContainer) {
    throw "OEM_TO_ANSI_STRING: NIMP";
}
function COMPARE_STRING(ctx: VmStateContainer) {
    throw "COMPARE_STRING: NIMP";
}
function COMPAREI_STRING(ctx: VmStateContainer) {
    throw "COMPAREI_STRING: NIMP";
}
function LENGTH_STRING(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.popString().length);
}
function LTRIM_STRING(ctx: VmStateContainer) {
    throw "LTRIM_STRING: NIMP";
}
function RTRIM_STRING(ctx: VmStateContainer) {
    throw "RTRIM_STRING: NIMP";
}
function ALLTRIM_STRING(ctx: VmStateContainer) {
    throw "ALLTRIM_STRING: NIMP";
}
function ASCII_STRING(ctx: VmStateContainer) {
    throw "ASCII_STRING: NIMP";
}
function CHR_STRING(ctx: VmStateContainer) {
    ctx.pushString(String.fromCharCode(ctx.popDouble()));
}
function FLOAT_TO_STRING(ctx: VmStateContainer) {
    ctx.pushString(ctx.popDouble().toString());
}
function STRING_TO_FLOAT(ctx: VmStateContainer) {
    ctx.pushDouble(parseFloat(ctx.popString()) || 0);
}
function PLUS_STRING_FLOAT(ctx: VmStateContainer) {
    const b = ctx.popDouble();
    const a = ctx.popString();
    ctx.pushString(a + b);
}
function PLUS_FLOAT_STRING(ctx: VmStateContainer) {
    const b = ctx.popString();
    const a = ctx.popDouble();
    ctx.pushString(a + b);
}

export function initBase(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(Opcode.V_END, V_END);

    addOperation(Opcode.PUSH_FLOAT, PUSH_FLOAT as Operation);
    addOperation(Opcode._PUSH_FLOAT, _PUSH_FLOAT as Operation);
    addOperation(Opcode.PUSH_FLOAT_const, PUSH_FLOAT_const as Operation);
    addOperation(Opcode.PUSH_FLOAT_PTR, PUSH_FLOAT_PTR as Operation);
    addOperation(Opcode._POP_FLOAT, _POP_FLOAT as Operation);
    addOperation(Opcode._POP_FLOAT_OLD, _POP_FLOAT_OLD as Operation);
    addOperation(Opcode.POP_FLOAT_PTR, POP_FLOAT_PTR as Operation);
    addOperation(Opcode.vmPUSH_LONG, vmPUSH_LONG as Operation);
    addOperation(Opcode.vmPUSH_LONG_const, vmPUSH_LONG_const as Operation);
    addOperation(Opcode.vm_PUSH_LONG, vm_PUSH_LONG as Operation);
    addOperation(Opcode.vm_POP_LONG, vm_POP_LONG as Operation);
    addOperation(Opcode.vm_POP_LONG_OLD, vm_POP_LONG_OLD);
    addOperation(Opcode.PUSH_STRING, PUSH_STRING as Operation);
    addOperation(Opcode._PUSH_STRING, _PUSH_STRING as Operation);
    addOperation(Opcode.PUSH_STRING_CONST, PUSH_STRING_CONST as Operation);
    addOperation(Opcode._POP_STRING, _POP_STRING as Operation);
    addOperation(Opcode.V_JMP, V_JMP as Operation);
    addOperation(Opcode.V_JNZ, V_JNZ as Operation);
    addOperation(Opcode.V_JZ, V_JZ as Operation);
    addOperation(Opcode.V_JNZ_HANDLE, V_JNZ_HANDLE as Operation);
    addOperation(Opcode.V_JZ_HANDLE, V_JZ_HANDLE as Operation);
    addOperation(Opcode.PUSHPTRNEW, PUSHPTRNEW as Operation);
    addOperation(Opcode.PUSHPTR, PUSHPTR as Operation);

    addOperation(Opcode.FLOAT_TO_LONG, FLOAT_TO_LONG);
    addOperation(Opcode.LONG_TO_FLOAT, LONG_TO_FLOAT);
    addOperation(Opcode._POP_STRING_OLD, _POP_STRING_OLD);
    addOperation(Opcode.GETTICKCOUNT, GETTICKCOUNT);
    addOperation(Opcode.V_SIN, V_SIN);
    addOperation(Opcode.V_COS, V_COS);
    addOperation(Opcode.V_ASIN, V_ASIN);
    addOperation(Opcode.V_ACOS, V_ACOS);
    addOperation(Opcode.V_ATAN, V_ATAN);
    addOperation(Opcode.V_TAN, V_TAN);
    addOperation(Opcode.V_EXP, V_EXP);
    addOperation(Opcode.V_SQRT, V_SQRT);
    addOperation(Opcode.V_SQR, V_SQR);
    addOperation(Opcode.V_ED, V_ED);
    addOperation(Opcode.V_DELTA, V_DELTA);
    addOperation(Opcode.V_MUL_F, V_MUL_F);
    addOperation(Opcode.V_DIV_F, V_DIV_F);
    addOperation(Opcode.V_ADD_F, V_ADD_F);
    addOperation(Opcode.V_SUB_F, V_SUB_F);
    // addOperation(Opcode.V_BIG_SUB, V_BIG_SUB);
    addOperation(Opcode.V_MOD, V_MOD);
    addOperation(Opcode.V_LN, V_LN);
    addOperation(Opcode.V_LG, V_LG);
    addOperation(Opcode.V_LOG, V_LOG);
    addOperation(Opcode.V_STEPEN, V_STEPEN);
    addOperation(Opcode.V_MAX, V_MAX);
    addOperation(Opcode.V_MIN, V_MIN);
    addOperation(Opcode.V_AVERAGE, V_AVERAGE);
    addOperation(Opcode.V_ROUND, V_ROUND);
    addOperation(Opcode.V_TRUNC, V_TRUNC);
    addOperation(Opcode.V_RANDOM, V_RANDOM);
    addOperation(Opcode.V_ABS, V_ABS);
    addOperation(Opcode.V_SGN, V_SGN);
    addOperation(Opcode.V_RAD, V_RAD);
    addOperation(Opcode.V_DEG, V_DEG);
    addOperation(Opcode.V_AND, V_AND);
    addOperation(Opcode.V_OR, V_OR);
    addOperation(Opcode.V_NOT, V_NOT);
    addOperation(Opcode.V_STOP, V_STOP);
    addOperation(Opcode.V_UN_MINUS, V_UN_MINUS);
    addOperation(Opcode.V_AND_BINARY, V_AND_BINARY);
    addOperation(Opcode.V_OR_BINARY, V_OR_BINARY);
    addOperation(Opcode.V_SHR, V_SHR);
    addOperation(Opcode.V_SHL, V_SHL);
    addOperation(Opcode.V_EQUAL, V_EQUAL);
    addOperation(Opcode.V_NOTEQUAL, V_NOTEQUAL);
    addOperation(Opcode.V_MORE, V_MORE);
    addOperation(Opcode.V_MOREorEQUAL, V_MOREorEQUAL);
    addOperation(Opcode.V_LOW, V_LOW);
    addOperation(Opcode.V_LOWorEQUAL, V_LOWorEQUAL);
    addOperation(Opcode.S_EQUAL, S_EQUAL);
    addOperation(Opcode.S_NOTEQUAL, S_NOTEQUAL);
    addOperation(Opcode.S_MORE, S_MORE);
    addOperation(Opcode.S_MOREorEQUAL, S_MOREorEQUAL);
    addOperation(Opcode.S_LOW, S_LOW);
    addOperation(Opcode.S_LOWorEQUAL, S_LOWorEQUAL);
    addOperation(Opcode.V_EQUALI, V_EQUALI);
    addOperation(Opcode.V_NOTEQUALI, V_NOTEQUALI);
    addOperation(Opcode.V_EDI, V_EDI);
    addOperation(Opcode.V_ANDI, V_ANDI);
    addOperation(Opcode.V_ORI, V_ORI);
    addOperation(Opcode.V_NOTI, V_NOTI);
    addOperation(Opcode.V_NOTbin, V_NOTbin);
    addOperation(Opcode.V_MCREATE, V_MCREATE);
    addOperation(Opcode.V_MDELETE, V_MDELETE);
    addOperation(Opcode.V_MFILL, V_MFILL);
    addOperation(Opcode.V_MGET, V_MGET);
    addOperation(Opcode.V_MPUT, V_MPUT);
    addOperation(Opcode.V_MEDITOR, V_MEDITOR);
    addOperation(Opcode.V_MDIAG, V_MDIAG);
    addOperation(Opcode.V_MADDX, V_MADDX);
    addOperation(Opcode.V_MSUBX, V_MSUBX);
    addOperation(Opcode.V_MDET, V_MDET);
    addOperation(Opcode.V_MDELTA, V_MDELTA);
    addOperation(Opcode.V_MED, V_MED);
    addOperation(Opcode.V_MDIVX, V_MDIVX);
    addOperation(Opcode.V_MMULX, V_MMULX);
    addOperation(Opcode.V_TRANSP, V_TRANSP);
    addOperation(Opcode.V_MADDC, V_MADDC);
    addOperation(Opcode.V_MNOT, V_MNOT);
    addOperation(Opcode.V_MSUM, V_MSUM);
    addOperation(Opcode.V_MSUBC, V_MSUBC);
    addOperation(Opcode.V_MMULC, V_MMULC);
    addOperation(Opcode.V_MDIVC, V_MDIVC);
    addOperation(Opcode.V_MMUL, V_MMUL);
    addOperation(Opcode.V_MGLUE, V_MGLUE);
    addOperation(Opcode.V_MCUT, V_MCUT);
    addOperation(Opcode.V_MMOVE, V_MMOVE);
    addOperation(Opcode.V_MOBR, V_MOBR);
    addOperation(Opcode.V_MLOAD, V_MLOAD);
    addOperation(Opcode.V_MSAVEAS, V_MSAVEAS);
    addOperation(Opcode.V_MDIM, V_MDIM);
    addOperation(Opcode.SCHANGE, SCHANGE);
    addOperation(Opcode.PLUS_STRING, PLUS_STRING);
    addOperation(Opcode.LEFT_STRING, LEFT_STRING);
    addOperation(Opcode.RIGHT_STRING, RIGHT_STRING);
    addOperation(Opcode.SUBSTR_STRING, SUBSTR_STRING);
    addOperation(Opcode.POS_STRING, POS_STRING);
    addOperation(Opcode.REPLICATE_STRING, REPLICATE_STRING);
    addOperation(Opcode.LOWER_STRING, LOWER_STRING);
    addOperation(Opcode.UPPER_STRING, UPPER_STRING);
    addOperation(Opcode.ANSI_TO_OEM_STRING, ANSI_TO_OEM_STRING);
    addOperation(Opcode.OEM_TO_ANSI_STRING, OEM_TO_ANSI_STRING);
    addOperation(Opcode.COMPARE_STRING, COMPARE_STRING);
    addOperation(Opcode.COMPAREI_STRING, COMPAREI_STRING);
    addOperation(Opcode.LENGTH_STRING, LENGTH_STRING);
    addOperation(Opcode.LTRIM_STRING, LTRIM_STRING);
    addOperation(Opcode.RTRIM_STRING, RTRIM_STRING);
    addOperation(Opcode.ALLTRIM_STRING, ALLTRIM_STRING);
    addOperation(Opcode.ASCII_STRING, ASCII_STRING);
    addOperation(Opcode.CHR_STRING, CHR_STRING);
    addOperation(Opcode.FLOAT_TO_STRING, FLOAT_TO_STRING);
    addOperation(Opcode.STRING_TO_FLOAT, STRING_TO_FLOAT);
    addOperation(Opcode.PLUS_STRING_FLOAT, PLUS_STRING_FLOAT);
    addOperation(Opcode.PLUS_FLOAT_STRING, PLUS_FLOAT_STRING);
}
