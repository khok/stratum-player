import { Opcode } from "~/helpers/vmConstants";

//Пока работает - переписывать на TS не буду

function V_END(ctx) {}

function PUSH_FLOAT(ctx, varId) {
    ctx.stackPush(ctx.currentClass.getOldVarValue(varId));
}
function _PUSH_FLOAT(ctx, varId) {
    ctx.stackPush(ctx.currentClass.getNewVarValue(varId));
}
function PUSH_FLOAT_const(ctx, _double) {
    ctx.stackPush(_double);
}
function PUSH_FLOAT_PTR(ctx) {
    throw "PUSH_FLOAT_PTR: NIMP";
}

function _POP_FLOAT(ctx, varId) {
    ctx.currentClass.setNewVarValue(varId, ctx.stackPop());
}
function _POP_FLOAT_OLD(ctx, varId) {
    ctx.currentClass.setOldVarValue(varId, ctx.stackPop());
}
function POP_FLOAT_PTR(ctx) {
    throw "POP_FLOAT_PTR: NIMP";
}

function vmPUSH_LONG(ctx, varId) {
    ctx.stackPush(ctx.currentClass.getOldVarValue(varId));
}
function vmPUSH_LONG_const(ctx, _uint) {
    ctx.stackPush(_uint);
}
function vm_PUSH_LONG(ctx, varId) {
    ctx.stackPush(ctx.currentClass.getNewVarValue(varId));
}
function vm_POP_LONG(ctx, varId) {
    ctx.currentClass.setNewVarValue(varId, ctx.stackPop());
}
function vm_POP_LONG_OLD(ctx) {
    throw "vm_POP_LONG_OLD: NIMP";
}

function FLOAT_TO_LONG(ctx) {
    ctx.stackPush(Math.floor(ctx.stackPop()));
}
function LONG_TO_FLOAT(ctx) {
    //я люблю кушать в KFC
}

function PUSH_STRING(ctx, varId) {
    ctx.stackPush(ctx.currentClass.getOldVarValue(varId));
}
function _PUSH_STRING(ctx, varId) {
    ctx.stackPush(ctx.currentClass.getNewVarValue(varId));
}
function PUSH_STRING_CONST(ctx, _string) {
    ctx.stackPush(_string);
}
function _POP_STRING(ctx, varId) {
    ctx.currentClass.setNewVarValue(varId, ctx.stackPop());
}
function _POP_STRING_OLD(ctx) {
    throw "_POP_STRING_OLD: NIMP";
}
function GETTICKCOUNT(ctx) {
    throw "GETTICKCOUNT: NIMP";
}
function V_SIN(ctx) {
    ctx.stackPush(Math.sin(ctx.stackPop()));
}
function V_COS(ctx) {
    ctx.stackPush(Math.cos(ctx.stackPop()));
}
function V_ASIN(ctx) {
    throw "V_ASIN: NIMP";
}
function V_ACOS(ctx) {
    throw "V_ACOS: NIMP";
}
function V_ATAN(ctx) {
    throw "V_ATAN: NIMP";
}
function V_TAN(ctx) {
    throw "V_TAN: NIMP";
}
function V_EXP(ctx) {
    throw "V_EXP: NIMP";
}
function V_SQRT(ctx) {
    const value = ctx.stackPop();
    ctx.stackPush(Math.sqrt(value) || 0);
}
function V_SQR(ctx) {
    throw "V_SQR: NIMP";
}
function V_ED(ctx) {
    throw "V_ED: NIMP";
}
function V_DELTA(ctx) {
    throw "V_DELTA: NIMP";
}
function V_MUL_F(ctx) {
    ctx.stackPush(ctx.stackPop() * ctx.stackPop());
}
function V_DIV_F(ctx) {
    const b = ctx.stackPop();
    const a = ctx.stackPop();
    ctx.stackPush(b == 0 ? 0 : a / b);
}
function V_ADD_F(ctx) {
    ctx.stackPush(ctx.stackPop() + ctx.stackPop());
}
function V_SUB_F(ctx) {
    const b = ctx.stackPop();
    const a = ctx.stackPop();
    ctx.stackPush(a - b);
}
// function V_BIG_SUB (ctx) {
//     throw 'V_BIG_SUB: NIMP'
// }
function V_MOD(ctx) {
    const y = ctx.stackPop();
    const x = ctx.stackPop();
    ctx.stackPush(x % y);
}
function V_LN(ctx) {
    ctx.stackPush(Math.log(ctx.stackPop()));
}
function V_LG(ctx) {
    ctx.stackPush(Math.log10(ctx.stackPop()));
}
function V_LOG(ctx) {
    throw "V_LOG: NIMP";
    // const value = ctx.stackPop();
    // const base = ctx.stackPop();
    //ctx.// stackPush(log(value)/(base ? log(base) : 1));
}
function V_STEPEN(ctx) {
    const y = ctx.stackPop();
    const x = ctx.stackPop();
    ctx.stackPush(Math.pow(x, y));
}
function V_MAX(ctx) {
    ctx.stackPush(Math.max(ctx.stackPop(), ctx.stackPop()));
}
function V_MIN(ctx) {
    ctx.stackPush(Math.min(ctx.stackPop(), ctx.stackPop()));
}
function V_AVERAGE(ctx) {
    ctx.stackPush((ctx.stackPop() + ctx.stackPop()) / 2);
}
function V_ROUND(ctx) {
    const dec = Math.pow(10, Math.floor(ctx.stackPop()));
    const value = ctx.stackPop();
    ctx.stackPush(Math.round(value * dec) / dec);
}
function V_TRUNC(ctx) {
    ctx.stackPush(Math.trunc(ctx.stackPop()));
}
function V_RANDOM(ctx) {
    ctx.stackPush(ctx.stackPop() * Math.random());
}
function V_ABS(ctx) {
    ctx.stackPush(Math.abs(ctx.stackPop()));
}
function V_SGN(ctx) {
    throw "V_SGN: NIMP";
}
function V_RAD(ctx) {
    throw "V_RAD: NIMP";
}
function V_DEG(ctx) {
    throw "V_DEG: NIMP";
}

function V_AND(ctx) {
    const a = ctx.stackPop();
    const b = ctx.stackPop();
    ctx.stackPush(a && b);
}
function V_OR(ctx) {
    const a = ctx.stackPop();
    const b = ctx.stackPop();
    ctx.stackPush(a || b);
}
function V_NOT(ctx) {
    ctx.stackPush(Number(ctx.stackPop() == 0));
}
function V_JMP(ctx, _codepoint) {
    ctx.jumpTo(_codepoint);
}
function V_JNZ(ctx, _codepoint) {
    if (ctx.stackPop()) ctx.jumpTo(_codepoint);
}
//if(cond == true){} <-- if not - jump to block end
function V_JZ(ctx, _codepoint) {
    if (!ctx.stackPop()) ctx.jumpTo(_codepoint);
}
function V_JNZ_HANDLE(ctx, _codepoint) {
    if (ctx.stackPop()) ctx.jumpTo(_codepoint);
}
function V_JZ_HANDLE(ctx, _codepoint) {
    if (!ctx.stackPop()) ctx.jumpTo(_codepoint);
}
function V_STOP(ctx) {
    throw "V_STOP: NIMP";
}
function V_UN_MINUS(ctx) {
    ctx.stackPush(-ctx.stackPop());
}
function V_AND_BINARY(ctx) {
    ctx.stackPush(ctx.stackPop() & ctx.stackPop());
}
function V_OR_BINARY(ctx) {
    ctx.stackPush(ctx.stackPop() | ctx.stackPop());
}
function V_SHR(ctx) {
    throw "V_SHR: NIMP";
}
function V_SHL(ctx) {
    throw "V_SHL: NIMP";
}
function V_EQUAL(ctx) {
    ctx.stackPush(Number(ctx.stackPop() == ctx.stackPop()));
}
function V_NOTEQUAL(ctx) {
    ctx.stackPush(Number(ctx.stackPop() != ctx.stackPop()));
}
function V_MORE(ctx) {
    ctx.stackPush(Number(ctx.stackPop() < ctx.stackPop()));
}
function V_MOREorEQUAL(ctx) {
    ctx.stackPush(Number(ctx.stackPop() <= ctx.stackPop()));
}
function V_LOW(ctx) {
    ctx.stackPush(Number(ctx.stackPop() > ctx.stackPop()));
}
function V_LOWorEQUAL(ctx) {
    ctx.stackPush(Number(ctx.stackPop() >= ctx.stackPop()));
}
function S_EQUAL(ctx) {
    ctx.stackPush(Number(ctx.stackPop() == ctx.stackPop()));
}
function S_NOTEQUAL(ctx) {
    ctx.stackPush(Number(ctx.stackPop() != ctx.stackPop()));
}
function S_MORE(ctx) {
    ctx.stackPush(Number(ctx.stackPop() < ctx.stackPop()));
}
function S_MOREorEQUAL(ctx) {
    ctx.stackPush(Number(ctx.stackPop() <= ctx.stackPop()));
}
function S_LOW(ctx) {
    ctx.stackPush(Number(ctx.stackPop() > ctx.stackPop()));
}
function S_LOWorEQUAL(ctx) {
    ctx.stackPush(Number(ctx.stackPop() >= ctx.stackPop()));
}

function V_EQUALI(ctx) {
    ctx.stackPush(Number(ctx.stackPop() == ctx.stackPop()));
}
function V_NOTEQUALI(ctx) {
    ctx.stackPush(Number(ctx.stackPop() != ctx.stackPop()));
}

function V_EDI(ctx) {
    ctx.stackPush(Number(ctx.stackPop() > 0));
}
function V_ANDI(ctx) {
    const a = ctx.stackPop();
    const b = ctx.stackPop();
    ctx.stackPush(a && b);
}
function V_ORI(ctx) {
    const a = ctx.stackPop();
    const b = ctx.stackPop();
    ctx.stackPush(a || b);
}
function V_NOTI(ctx) {
    ctx.stackPush(Number(ctx.stackPop() == 0));
}
function V_NOTbin(ctx) {
    throw "V_NOTbin: NIMP";
}

function V_MCREATE(ctx) {
    throw "V_MCREATE: NIMP";
}
function V_MDELETE(ctx) {
    throw "V_MDELETE: NIMP";
}
function V_MFILL(ctx) {
    throw "V_MFILL: NIMP";
}
function V_MGET(ctx) {
    throw "V_MGET: NIMP";
}
function V_MPUT(ctx) {
    throw "V_MPUT: NIMP";
}
function V_MEDITOR(ctx) {
    throw "V_MEDITOR: NIMP";
}
function V_MDIAG(ctx) {
    throw "V_MDIAG: NIMP";
}
function V_MADDX(ctx) {
    throw "V_MADDX: NIMP";
}
function V_MSUBX(ctx) {
    throw "V_MSUBX: NIMP";
}
function V_MDET(ctx) {
    throw "V_MDET: NIMP";
}
function V_MDELTA(ctx) {
    throw "V_MDELTA: NIMP";
}
function V_MED(ctx) {
    throw "V_MED: NIMP";
}
function V_MDIVX(ctx) {
    throw "V_MDIVX: NIMP";
}
function V_MMULX(ctx) {
    throw "V_MMULX: NIMP";
}
function V_TRANSP(ctx) {
    throw "V_TRANSP: NIMP";
}
function V_MADDC(ctx) {
    throw "V_MADDC: NIMP";
}
function V_MNOT(ctx) {
    throw "V_MNOT: NIMP";
}
function V_MSUM(ctx) {
    throw "V_MSUM: NIMP";
}

function V_MSUBC(ctx) {
    throw "V_MSUBC: NIMP";
}
function V_MMULC(ctx) {
    throw "V_MMULC: NIMP";
}

function V_MDIVC(ctx) {
    throw "V_MDIVC: NIMP";
}
function V_MMUL(ctx) {
    throw "V_MMUL: NIMP";
}
function V_MGLUE(ctx) {
    throw "V_MGLUE: NIMP";
}
function V_MCUT(ctx) {
    throw "V_MCUT: NIMP";
}
function V_MMOVE(ctx) {
    throw "V_MMOVE: NIMP";
}
function V_MOBR(ctx) {
    throw "V_MOBR: NIMP";
}

function V_MLOAD(ctx) {
    throw "V_MLOAD: NIMP";
}
function V_MSAVEAS(ctx) {
    throw "V_MSAVEAS: NIMP";
}
function V_MDIM(ctx) {
    throw "V_MDIM: NIMP";
}

function SCHANGE(ctx) {
    const s3 = ctx.stackPop();
    const s2 = ctx.stackPop();
    const s1 = ctx.stackPop();
    ctx.stackPush(s1.replace(s2, s3));
}
function PLUS_STRING(ctx) {
    const b = ctx.stackPop();
    const a = ctx.stackPop();
    ctx.stackPush(a + b);
}
function LEFT_STRING(ctx) {
    const count = ctx.stackPop();
    const str = ctx.stackPop();
    ctx.stackPush(str.substr(0, count));
}
function RIGHT_STRING(ctx) {
    throw "RIGHT_STRING: NIMP";
}
// STRING Substr(STRING str, FLOAT pos, FLOAT n)
function SUBSTR_STRING(ctx) {
    const length = ctx.stackPop();
    const from = ctx.stackPop();
    const str = ctx.stackPop();
    ctx.stackPush(str.substr(from, length));
}
function POS_STRING(ctx) {
    throw "POS_STRING: NIMP";
}
function REPLICATE_STRING(ctx) {
    throw "REPLICATE_STRING: NIMP";
}
function LOWER_STRING(ctx) {
    throw "LOWER_STRING: NIMP";
}
function UPPER_STRING(ctx) {
    throw "UPPER_STRING: NIMP";
}
function ANSI_TO_OEM_STRING(ctx) {
    throw "ANSI_TO_OEM_STRING: NIMP";
}
function OEM_TO_ANSI_STRING(ctx) {
    throw "OEM_TO_ANSI_STRING: NIMP";
}
function COMPARE_STRING(ctx) {
    throw "COMPARE_STRING: NIMP";
}
function COMPAREI_STRING(ctx) {
    throw "COMPAREI_STRING: NIMP";
}
function LENGTH_STRING(ctx) {
    ctx.stackPush(ctx.stackPop().length);
}
function LTRIM_STRING(ctx) {
    throw "LTRIM_STRING: NIMP";
}
function RTRIM_STRING(ctx) {
    throw "RTRIM_STRING: NIMP";
}
function ALLTRIM_STRING(ctx) {
    throw "ALLTRIM_STRING: NIMP";
}
function ASCII_STRING(ctx) {
    throw "ASCII_STRING: NIMP";
}
function CHR_STRING(ctx) {
    ctx.stackPush(String.fromCharCode(ctx.stackPop()));
}
function FLOAT_TO_STRING(ctx) {
    ctx.stackPush(ctx.stackPop().toString());
}
function STRING_TO_FLOAT(ctx) {
    ctx.stackPush(parseFloat(ctx.stackPop()) || 0);
}
function PLUS_STRING_FLOAT(ctx) {
    const b = ctx.stackPop();
    const a = ctx.stackPop();
    ctx.stackPush(a + b);
}
function PLUS_FLOAT_STRING(ctx) {
    const b = ctx.stackPop();
    const a = ctx.stackPop();
    ctx.stackPush(a + b);
}

export function initBase(addOperation) {
    addOperation(Opcode.V_END, V_END);
    addOperation(Opcode.PUSH_FLOAT, PUSH_FLOAT);
    addOperation(Opcode._PUSH_FLOAT, _PUSH_FLOAT);
    addOperation(Opcode.PUSH_FLOAT_const, PUSH_FLOAT_const);
    addOperation(Opcode.PUSH_FLOAT_PTR, PUSH_FLOAT_PTR);
    addOperation(Opcode._POP_FLOAT, _POP_FLOAT);
    addOperation(Opcode._POP_FLOAT_OLD, _POP_FLOAT_OLD);
    addOperation(Opcode.POP_FLOAT_PTR, POP_FLOAT_PTR);
    addOperation(Opcode.vmPUSH_LONG, vmPUSH_LONG);
    addOperation(Opcode.vmPUSH_LONG_const, vmPUSH_LONG_const);
    addOperation(Opcode.vm_PUSH_LONG, vm_PUSH_LONG);
    addOperation(Opcode.vm_POP_LONG, vm_POP_LONG);
    addOperation(Opcode.vm_POP_LONG_OLD, vm_POP_LONG_OLD);
    addOperation(Opcode.FLOAT_TO_LONG, FLOAT_TO_LONG);
    addOperation(Opcode.LONG_TO_FLOAT, LONG_TO_FLOAT);
    addOperation(Opcode.PUSH_STRING, PUSH_STRING);
    addOperation(Opcode._PUSH_STRING, _PUSH_STRING);
    addOperation(Opcode.PUSH_STRING_CONST, PUSH_STRING_CONST);
    addOperation(Opcode._POP_STRING, _POP_STRING);
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
    addOperation(Opcode.V_JMP, V_JMP);
    addOperation(Opcode.V_JNZ, V_JNZ);
    addOperation(Opcode.V_JZ, V_JZ);
    addOperation(Opcode.V_JNZ_HANDLE, V_JNZ_HANDLE);
    addOperation(Opcode.V_JZ_HANDLE, V_JZ_HANDLE);
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
