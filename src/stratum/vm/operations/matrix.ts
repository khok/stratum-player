import { OpCode } from "../consts";
import { ExecutionContext } from "../executionContext";
import { Operation } from "../types";

// FLOAT MGet(FLOAT Q, FLOAT I, FLOAT J, FLOAT Flag)
function MGet(ctx: ExecutionContext) {
    const flag = ctx.popDouble();
    const j = ctx.popDouble();
    const i = ctx.popDouble();
    const q = ctx.popDouble();
    console.warn(`Вызов MGet(${q}, ${i}, ${j}, ${flag})`);
    ctx.pushDouble(0);
}

export function initMatrix(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(OpCode.V_MGET, MGet);
    // addOperation(Opcode.V_MCREATE, V_MCREATE);
    // addOperation(Opcode.V_MDELETE, V_MDELETE);
    // addOperation(Opcode.V_MFILL, V_MFILL);
    // addOperation(Opcode.V_MGET, V_MGET);
    // addOperation(Opcode.V_MPUT, V_MPUT);
    // addOperation(Opcode.V_MEDITOR, V_MEDITOR);
    // addOperation(Opcode.V_MDIAG, V_MDIAG);
    // addOperation(Opcode.V_MADDX, V_MADDX);
    // addOperation(Opcode.V_MSUBX, V_MSUBX);
    // addOperation(Opcode.V_MDET, V_MDET);
    // addOperation(Opcode.V_MDELTA, V_MDELTA);
    // addOperation(Opcode.V_MED, V_MED);
    // addOperation(Opcode.V_MDIVX, V_MDIVX);
    // addOperation(Opcode.V_MMULX, V_MMULX);
    // addOperation(Opcode.V_TRANSP, V_TRANSP);
    // addOperation(Opcode.V_MADDC, V_MADDC);
    // addOperation(Opcode.V_MNOT, V_MNOT);
    // addOperation(Opcode.V_MSUM, V_MSUM);
    // addOperation(Opcode.V_MSUBC, V_MSUBC);
    // addOperation(Opcode.V_MMULC, V_MMULC);
    // addOperation(Opcode.V_MDIVC, V_MDIVC);
    // addOperation(Opcode.V_MMUL, V_MMUL);
    // addOperation(Opcode.V_MGLUE, V_MGLUE);
    // addOperation(Opcode.V_MCUT, V_MCUT);
    // addOperation(Opcode.V_MMOVE, V_MMOVE);
    // addOperation(Opcode.V_MOBR, V_MOBR);
    // addOperation(Opcode.V_MLOAD, V_MLOAD);
    // addOperation(Opcode.V_MSAVEAS, V_MSAVEAS);
    // addOperation(Opcode.V_MDIM, V_MDIM);
}
