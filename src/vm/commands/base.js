import { Opcode } from "..";

//Пока работает - переписывать на TS не буду

function V_END () {}

function PUSH_FLOAT (vm, varId) {
    vm.stackPush(vm.currentClass.getOldVarValue(varId));
}
function _PUSH_FLOAT (vm, varId) {
    vm.stackPush(vm.currentClass.getNewVarValue(varId));
}
function PUSH_FLOAT_const (vm, _double) {
    vm.stackPush(_double);
}
function PUSH_FLOAT_PTR (vm) {
    throw 'PUSH_FLOAT_PTR: NIMP'
}

function _POP_FLOAT (vm, varId) {
    vm.currentClass.setNewVarValue(varId, vm.stackPop());
}
function _POP_FLOAT_OLD (vm, varId) {
    vm.currentClass.setOldVarValue(varId, vm.stackPop());
}
function POP_FLOAT_PTR (vm) {
    throw 'POP_FLOAT_PTR: NIMP'
}

function vmPUSH_LONG (vm, varId) {
    vm.stackPush(vm.currentClass.getOldVarValue(varId));
}
function vmPUSH_LONG_const (vm, _uint) {
    vm.stackPush(_uint);
}
function vm_PUSH_LONG (vm, varId) {
    vm.stackPush(vm.currentClass.getNewVarValue(varId));
}
function vm_POP_LONG (vm, varId) {
    vm.currentClass.setNewVarValue(varId, vm.stackPop());
}
function vm_POP_LONG_OLD (vm) {
    throw 'vm_POP_LONG_OLD: NIMP'
}

function FLOAT_TO_LONG (vm) {
    vm.stackPush(Math.floor(vm.stackPop()));
}
function LONG_TO_FLOAT (vm) {
    // throw 'LONG_TO_FLOAT: NIMP'
}

function PUSH_STRING (vm, varId) {
    vm.stackPush(vm.currentClass.getOldVarValue(varId));
}
function _PUSH_STRING (vm, varId) {
    vm.stackPush(vm.currentClass.getNewVarValue(varId));
}
function PUSH_STRING_CONST (vm, _string) {
    vm.stackPush(_string);
}
function _POP_STRING (vm, varId) {
    vm.currentClass.setNewVarValue(varId, vm.stackPop());
}
function _POP_STRING_OLD (vm) {
    throw '_POP_STRING_OLD: NIMP'
}
function GETTICKCOUNT (vm) {
    throw 'GETTICKCOUNT: NIMP'
}
function V_SIN (vm) {
    vm.stackPush(Math.sin(vm.stackPop()));
}
function V_COS (vm) {
    vm.stackPush(Math.cos(vm.stackPop()));
}
function V_ASIN (vm) {
    throw 'V_ASIN: NIMP'
}
function V_ACOS (vm) {
    throw 'V_ACOS: NIMP'
}
function V_ATAN (vm) {
    throw 'V_ATAN: NIMP'
}
function V_TAN (vm) {
    throw 'V_TAN: NIMP'
}
function V_EXP (vm) {
    throw 'V_EXP: NIMP'
}
function V_SQRT (vm) {
    const value = vm.stackPop();
    if(value < 0)
        throw 'Sqrt error: value < 0'
    vm.stackPush(Math.sqrt(value));
}
function V_SQR (vm) {
    throw 'V_SQR: NIMP'
}
function V_ED (vm) {
    throw 'V_ED: NIMP'
}
function V_DELTA (vm) {
    throw 'V_DELTA: NIMP'
}
function V_MUL_F (vm) {
    vm.stackPush(vm.stackPop() * vm.stackPop());
}
function V_DIV_F (vm) {
    const b = vm.stackPop();
    if(b == 0)
        throw Error('Divide by zero');
    const a = vm.stackPop();
    vm.stackPush(a / b);
}
function V_ADD_F (vm) {
    vm.stackPush(vm.stackPop() + vm.stackPop());
}
function V_SUB_F (vm) {
    const b = vm.stackPop();
    const a = vm.stackPop();
    vm.stackPush(a - b);
}
// function V_BIG_SUB (vm) {
//     throw 'V_BIG_SUB: NIMP'
// }
function V_MOD (vm) {
    const y = vm.stackPop();
    const x = vm.stackPop();
    vm.stackPush(x % y);
}
function V_LN (vm) {
    vm.stackPush(Math.log(vm.stackPop()));
}
function V_LG (vm) {
    vm.stackPush(Math.log10(vm.stackPop()));
}
function V_LOG (vm) {
    throw 'V_LOG: NIMP'
    // const value = vm.stackPop();
    // const base = vm.stackPop();
    //vm.// stackPush(log(value)/(base ? log(base) : 1));
}
function V_STEPEN (vm) {
    const y = vm.stackPop();
    const x = vm.stackPop();
    vm.stackPush(Math.pow(x, y));
}
function V_MAX (vm) {
    vm.stackPush(Math.max(vm.stackPop(), vm.stackPop()));
}
function V_MIN (vm) {
    vm.stackPush(Math.min(vm.stackPop(), vm.stackPop()));
}
function V_AVERAGE (vm) {
    vm.stackPush((vm.stackPop() + vm.stackPop()) / 2);
}
function V_ROUND (vm) {
    const dec = Math.pow(10, Math.floor(vm.stackPop()));
    const value = vm.stackPop();
    vm.stackPush(Math.round(value * dec) / dec);
}
function V_TRUNC (vm) {
    throw 'V_TRUNC: NIMP'
}
function V_RANDOM (vm) {
    vm.stackPush(vm.stackPop() * Math.random());
}
function V_ABS (vm) {
    vm.stackPush(Math.abs(vm.stackPop()));
}
function V_SGN (vm) {
    throw 'V_SGN: NIMP'
}
function V_RAD (vm) {
    throw 'V_RAD: NIMP'
}
function V_DEG (vm) {
    throw 'V_DEG: NIMP'
}

function V_AND (vm) {
    vm.stackPush(vm.stackPop() && vm.stackPop());
}
function V_OR (vm) {
    vm.stackPush(vm.stackPop() || vm.stackPop());
}
function V_NOT (vm) {
    vm.stackPush(vm.stackPop() == 0 ? 1 : 0);
}
function V_JMP (vm, _codepoint) {
    vm.jumpTo(_codepoint);
}
function V_JNZ (vm, _codepoint) {
    if(vm.stackPop())
        vm.jumpTo(_codepoint);
}
//if(cond == true){} <-- if not - jump to block end
function V_JZ (vm, _codepoint) {
    if(!vm.stackPop())
        vm.jumpTo(_codepoint);
}
function V_JNZ_HANDLE (vm, _codepoint) {
    if(vm.stackPop())
        vm.jumpTo(_codepoint);
}
function V_JZ_HANDLE (vm, _codepoint) {
    if(!vm.stackPop())
        vm.jumpTo(_codepoint);
}
function V_STOP (vm) {
    throw 'V_STOP: NIMP'
}
function V_UN_MINUS (vm) {
    vm.stackPush(-vm.stackPop());
}
function V_AND_BINARY (vm) {
    vm.stackPush(vm.stackPop() & vm.stackPop())
}
function V_OR_BINARY (vm) {
    vm.stackPush(vm.stackPop() | vm.stackPop())
}
function V_SHR (vm) {
    throw 'V_SHR: NIMP'
}
function V_SHL (vm) {
    throw 'V_SHL: NIMP'
}
function V_EQUAL (vm) {
    vm.stackPush(vm.stackPop() == vm.stackPop());
}
function V_NOTEQUAL (vm) {
    vm.stackPush(vm.stackPop() != vm.stackPop());
}
function V_MORE (vm) {
    vm.stackPush(vm.stackPop() < vm.stackPop());
}
function V_MOREorEQUAL (vm) {
    vm.stackPush(vm.stackPop() <= vm.stackPop());
}
function V_LOW (vm) {
    vm.stackPush(vm.stackPop() > vm.stackPop());
}
function V_LOWorEQUAL (vm) {
    vm.stackPush(vm.stackPop() >= vm.stackPop());
}
function S_EQUAL (vm) {
    vm.stackPush(vm.stackPop() == vm.stackPop());
}
function S_NOTEQUAL (vm) {
    vm.stackPush(vm.stackPop() != vm.stackPop());
}
function S_MORE (vm) {
    vm.stackPush(vm.stackPop() < vm.stackPop());
}
function S_MOREorEQUAL (vm) {
    vm.stackPush(vm.stackPop() <= vm.stackPop());
}
function S_LOW (vm) {
    vm.stackPush(vm.stackPop() > vm.stackPop());
}
function S_LOWorEQUAL (vm) {
    vm.stackPush(vm.stackPop() >= vm.stackPop());
}

function V_EQUALI (vm) {
    vm.stackPush(vm.stackPop() == vm.stackPop());
}
function V_NOTEQUALI (vm) {
    vm.stackPush(vm.stackPop() != vm.stackPop());
}

function V_EDI (vm) {
    vm.stackPush(vm.stackPop() > 0);
}
function V_ANDI (vm) {
    vm.stackPush(vm.stackPop() && vm.stackPop());
}
function V_ORI (vm) {
    vm.stackPush(vm.stackPop() || vm.stackPop());
}
function V_NOTI (vm) {
    vm.stackPush(vm.stackPop() == 0 ? 1 : 0);
}
function V_NOTbin (vm) {
    throw 'V_NOTbin: NIMP'
}

function V_MCREATE (vm) {
    throw 'V_MCREATE: NIMP'
}
function V_MDELETE (vm) {
    throw 'V_MDELETE: NIMP'
}
function V_MFILL (vm) {
    throw 'V_MFILL: NIMP'
}
function V_MGET (vm) {
    throw 'V_MGET: NIMP'
}
function V_MPUT (vm) {
    throw 'V_MPUT: NIMP'
}
function V_MEDITOR (vm) {
    throw 'V_MEDITOR: NIMP'
}
function V_MDIAG (vm) {
    throw 'V_MDIAG: NIMP'
}
function V_MADDX (vm) {
    throw 'V_MADDX: NIMP'
}
function V_MSUBX (vm) {
    throw 'V_MSUBX: NIMP'
}
function V_MDET (vm) {
    throw 'V_MDET: NIMP'
}
function V_MDELTA (vm) {
    throw 'V_MDELTA: NIMP'
}
function V_MED (vm) {
    throw 'V_MED: NIMP'
}
function V_MDIVX (vm) {
    throw 'V_MDIVX: NIMP'
}
function V_MMULX (vm) {
    throw 'V_MMULX: NIMP'
}
function V_TRANSP (vm) {
    throw 'V_TRANSP: NIMP'
}
function V_MADDC (vm) {
    throw 'V_MADDC: NIMP'
}
function V_MNOT (vm) {
    throw 'V_MNOT: NIMP'
}
function V_MSUM (vm) {
    throw 'V_MSUM: NIMP'
}

function V_MSUBC (vm) {
    throw 'V_MSUBC: NIMP'
}
function V_MMULC (vm) {
    throw 'V_MMULC: NIMP'
}

function V_MDIVC (vm) {
    throw 'V_MDIVC: NIMP'
}
function V_MMUL (vm) {
    throw 'V_MMUL: NIMP'
}
function V_MGLUE (vm) {
    throw 'V_MGLUE: NIMP'
}
function V_MCUT (vm) {
    throw 'V_MCUT: NIMP'
}
function V_MMOVE (vm) {
    throw 'V_MMOVE: NIMP'
}
function V_MOBR (vm) {
    throw 'V_MOBR: NIMP'
}

function V_MLOAD (vm) {
    throw 'V_MLOAD: NIMP'
}
function V_MSAVEAS (vm) {
    throw 'V_MSAVEAS: NIMP'
}
function V_MDIM (vm) {
    throw 'V_MDIM: NIMP'
}

function SCHANGE (vm) {
    const s3 = vm.stackPop();
    const s2 = vm.stackPop();
    const s1 = vm.stackPop();
    vm.stackPush(s1.replace(s2, s3));
}
function PLUS_STRING (vm) {
    const b = vm.stackPop();
    const a = vm.stackPop();
    vm.stackPush(a + b);
}
function LEFT_STRING (vm) {
    throw 'LEFT_STRING: NIMP'
}
function RIGHT_STRING (vm) {
    throw 'RIGHT_STRING: NIMP'
}
function SUBSTR_STRING (vm) {
    throw 'SUBSTR_STRING: NIMP'
}
function POS_STRING (vm) {
    throw 'POS_STRING: NIMP'
}
function REPLICATE_STRING (vm) {
    throw 'REPLICATE_STRING: NIMP'
}
function LOWER_STRING (vm) {
    throw 'LOWER_STRING: NIMP'
}
function UPPER_STRING (vm) {
    throw 'UPPER_STRING: NIMP'
}
function ANSI_TO_OEM_STRING (vm) {
    throw 'ANSI_TO_OEM_STRING: NIMP'
}
function OEM_TO_ANSI_STRING (vm) {
    throw 'OEM_TO_ANSI_STRING: NIMP'
}
function COMPARE_STRING (vm) {
    throw 'COMPARE_STRING: NIMP'
}
function COMPAREI_STRING (vm) {
    throw 'COMPAREI_STRING: NIMP'
}
function LENGTH_STRING (vm) {
    vm.stackPush(vm.stackPop().length);
}
function LTRIM_STRING (vm) {
    throw 'LTRIM_STRING: NIMP'
}
function RTRIM_STRING (vm) {
    throw 'RTRIM_STRING: NIMP'
}
function ALLTRIM_STRING (vm) {
    throw 'ALLTRIM_STRING: NIMP'
}
function ASCII_STRING (vm) {
    throw 'ASCII_STRING: NIMP'
}
function CHR_STRING (vm) {
    vm.stackPush(String.fromCharCode(vm.stackPop()));
}
function FLOAT_TO_STRING (vm) {
    vm.stackPush(vm.stackPop().toString());
}
function STRING_TO_FLOAT (vm) {
    vm.stackPush(parseFloat(vm.stackPop()) || 0);
}
function PLUS_STRING_FLOAT (vm) {
    const b = vm.stackPop();
    const a = vm.stackPop();
    vm.stackPush(a + b);
}
function PLUS_FLOAT_STRING (vm) {
    const b = vm.stackPop();
    const a = vm.stackPop();
    vm.stackPush(a + b);
}

export default function init(addCommand) {

    addCommand(Opcode.V_END, V_END);
    addCommand(Opcode.PUSH_FLOAT, PUSH_FLOAT);
    addCommand(Opcode._PUSH_FLOAT, _PUSH_FLOAT);
    addCommand(Opcode.PUSH_FLOAT_const, PUSH_FLOAT_const);
    addCommand(Opcode.PUSH_FLOAT_PTR, PUSH_FLOAT_PTR);
    addCommand(Opcode._POP_FLOAT, _POP_FLOAT);
    addCommand(Opcode._POP_FLOAT_OLD, _POP_FLOAT_OLD);
    addCommand(Opcode.POP_FLOAT_PTR, POP_FLOAT_PTR);
    addCommand(Opcode.vmPUSH_LONG, vmPUSH_LONG);
    addCommand(Opcode.vmPUSH_LONG_const, vmPUSH_LONG_const);
    addCommand(Opcode.vm_PUSH_LONG, vm_PUSH_LONG);
    addCommand(Opcode.vm_POP_LONG, vm_POP_LONG);
    addCommand(Opcode.vm_POP_LONG_OLD, vm_POP_LONG_OLD);
    addCommand(Opcode.FLOAT_TO_LONG, FLOAT_TO_LONG);
    addCommand(Opcode.LONG_TO_FLOAT, LONG_TO_FLOAT);
    addCommand(Opcode.PUSH_STRING, PUSH_STRING);
    addCommand(Opcode._PUSH_STRING, _PUSH_STRING);
    addCommand(Opcode.PUSH_STRING_CONST, PUSH_STRING_CONST);
    addCommand(Opcode._POP_STRING, _POP_STRING);
    addCommand(Opcode._POP_STRING_OLD, _POP_STRING_OLD);
    addCommand(Opcode.GETTICKCOUNT, GETTICKCOUNT);
    addCommand(Opcode.V_SIN, V_SIN);
    addCommand(Opcode.V_COS, V_COS);
    addCommand(Opcode.V_ASIN, V_ASIN);
    addCommand(Opcode.V_ACOS, V_ACOS);
    addCommand(Opcode.V_ATAN, V_ATAN);
    addCommand(Opcode.V_TAN, V_TAN);
    addCommand(Opcode.V_EXP, V_EXP);
    addCommand(Opcode.V_SQRT, V_SQRT);
    addCommand(Opcode.V_SQR, V_SQR);
    addCommand(Opcode.V_ED, V_ED);
    addCommand(Opcode.V_DELTA, V_DELTA);
    addCommand(Opcode.V_MUL_F, V_MUL_F);
    addCommand(Opcode.V_DIV_F, V_DIV_F);
    addCommand(Opcode.V_ADD_F, V_ADD_F);
    addCommand(Opcode.V_SUB_F, V_SUB_F);
    // addCommand(Opcode.V_BIG_SUB, V_BIG_SUB);
    addCommand(Opcode.V_MOD, V_MOD);
    addCommand(Opcode.V_LN, V_LN);
    addCommand(Opcode.V_LG, V_LG);
    addCommand(Opcode.V_LOG, V_LOG);
    addCommand(Opcode.V_STEPEN, V_STEPEN);
    addCommand(Opcode.V_MAX, V_MAX);
    addCommand(Opcode.V_MIN, V_MIN);
    addCommand(Opcode.V_AVERAGE, V_AVERAGE);
    addCommand(Opcode.V_ROUND, V_ROUND);
    addCommand(Opcode.V_TRUNC, V_TRUNC);
    addCommand(Opcode.V_RANDOM, V_RANDOM);
    addCommand(Opcode.V_ABS, V_ABS);
    addCommand(Opcode.V_SGN, V_SGN);
    addCommand(Opcode.V_RAD, V_RAD);
    addCommand(Opcode.V_DEG, V_DEG);
    addCommand(Opcode.V_AND, V_AND);
    addCommand(Opcode.V_OR, V_OR);
    addCommand(Opcode.V_NOT, V_NOT);
    addCommand(Opcode.V_JMP, V_JMP);
    addCommand(Opcode.V_JNZ, V_JNZ);
    addCommand(Opcode.V_JZ, V_JZ);
    addCommand(Opcode.V_JNZ_HANDLE, V_JNZ_HANDLE);
    addCommand(Opcode.V_JZ_HANDLE, V_JZ_HANDLE);
    addCommand(Opcode.V_STOP, V_STOP);
    addCommand(Opcode.V_UN_MINUS, V_UN_MINUS);
    addCommand(Opcode.V_AND_BINARY, V_AND_BINARY);
    addCommand(Opcode.V_OR_BINARY, V_OR_BINARY);
    addCommand(Opcode.V_SHR, V_SHR);
    addCommand(Opcode.V_SHL, V_SHL);
    addCommand(Opcode.V_EQUAL, V_EQUAL);
    addCommand(Opcode.V_NOTEQUAL, V_NOTEQUAL);
    addCommand(Opcode.V_MORE, V_MORE);
    addCommand(Opcode.V_MOREorEQUAL, V_MOREorEQUAL);
    addCommand(Opcode.V_LOW, V_LOW);
    addCommand(Opcode.V_LOWorEQUAL, V_LOWorEQUAL);
    addCommand(Opcode.S_EQUAL, S_EQUAL);
    addCommand(Opcode.S_NOTEQUAL, S_NOTEQUAL);
    addCommand(Opcode.S_MORE, S_MORE);
    addCommand(Opcode.S_MOREorEQUAL, S_MOREorEQUAL);
    addCommand(Opcode.S_LOW, S_LOW);
    addCommand(Opcode.S_LOWorEQUAL, S_LOWorEQUAL);
    addCommand(Opcode.V_EQUALI, V_EQUALI);
    addCommand(Opcode.V_NOTEQUALI, V_NOTEQUALI);
    addCommand(Opcode.V_EDI, V_EDI);
    addCommand(Opcode.V_ANDI, V_ANDI);
    addCommand(Opcode.V_ORI, V_ORI);
    addCommand(Opcode.V_NOTI, V_NOTI);
    addCommand(Opcode.V_NOTbin, V_NOTbin);
    addCommand(Opcode.V_MCREATE, V_MCREATE);
    addCommand(Opcode.V_MDELETE, V_MDELETE);
    addCommand(Opcode.V_MFILL, V_MFILL);
    addCommand(Opcode.V_MGET, V_MGET);
    addCommand(Opcode.V_MPUT, V_MPUT);
    addCommand(Opcode.V_MEDITOR, V_MEDITOR);
    addCommand(Opcode.V_MDIAG, V_MDIAG);
    addCommand(Opcode.V_MADDX, V_MADDX);
    addCommand(Opcode.V_MSUBX, V_MSUBX);
    addCommand(Opcode.V_MDET, V_MDET);
    addCommand(Opcode.V_MDELTA, V_MDELTA);
    addCommand(Opcode.V_MED, V_MED);
    addCommand(Opcode.V_MDIVX, V_MDIVX);
    addCommand(Opcode.V_MMULX, V_MMULX);
    addCommand(Opcode.V_TRANSP, V_TRANSP);
    addCommand(Opcode.V_MADDC, V_MADDC);
    addCommand(Opcode.V_MNOT, V_MNOT);
    addCommand(Opcode.V_MSUM, V_MSUM);
    addCommand(Opcode.V_MSUBC, V_MSUBC);
    addCommand(Opcode.V_MMULC, V_MMULC);
    addCommand(Opcode.V_MDIVC, V_MDIVC);
    addCommand(Opcode.V_MMUL, V_MMUL);
    addCommand(Opcode.V_MGLUE, V_MGLUE);
    addCommand(Opcode.V_MCUT, V_MCUT);
    addCommand(Opcode.V_MMOVE, V_MMOVE);
    addCommand(Opcode.V_MOBR, V_MOBR);
    addCommand(Opcode.V_MLOAD, V_MLOAD);
    addCommand(Opcode.V_MSAVEAS, V_MSAVEAS);
    addCommand(Opcode.V_MDIM, V_MDIM);
    addCommand(Opcode.SCHANGE, SCHANGE);
    addCommand(Opcode.PLUS_STRING, PLUS_STRING);
    addCommand(Opcode.LEFT_STRING, LEFT_STRING);
    addCommand(Opcode.RIGHT_STRING, RIGHT_STRING);
    addCommand(Opcode.SUBSTR_STRING, SUBSTR_STRING);
    addCommand(Opcode.POS_STRING, POS_STRING);
    addCommand(Opcode.REPLICATE_STRING, REPLICATE_STRING);
    addCommand(Opcode.LOWER_STRING, LOWER_STRING);
    addCommand(Opcode.UPPER_STRING, UPPER_STRING);
    addCommand(Opcode.ANSI_TO_OEM_STRING, ANSI_TO_OEM_STRING);
    addCommand(Opcode.OEM_TO_ANSI_STRING, OEM_TO_ANSI_STRING);
    addCommand(Opcode.COMPARE_STRING, COMPARE_STRING);
    addCommand(Opcode.COMPAREI_STRING, COMPAREI_STRING);
    addCommand(Opcode.LENGTH_STRING, LENGTH_STRING);
    addCommand(Opcode.LTRIM_STRING, LTRIM_STRING);
    addCommand(Opcode.RTRIM_STRING, RTRIM_STRING);
    addCommand(Opcode.ALLTRIM_STRING, ALLTRIM_STRING);
    addCommand(Opcode.ASCII_STRING, ASCII_STRING);
    addCommand(Opcode.CHR_STRING, CHR_STRING);
    addCommand(Opcode.FLOAT_TO_STRING, FLOAT_TO_STRING);
    addCommand(Opcode.STRING_TO_FLOAT, STRING_TO_FLOAT);
    addCommand(Opcode.PLUS_STRING_FLOAT, PLUS_STRING_FLOAT);
    addCommand(Opcode.PLUS_FLOAT_STRING, PLUS_FLOAT_STRING);
}
