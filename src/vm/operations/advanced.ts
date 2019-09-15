import { Opcode } from "../opcode";
import { Operation, VmContext } from "../types";

function SendMessage(ctx: VmContext, count: number) {
    const vars = new Array<string | number | undefined>(count);
    for (let i = count - 1; i >= 0; i--) vars[i] = <string>ctx.stackPop();
    const className = <string>ctx.stackPop();
    const path = <string>ctx.stackPop();
    if (path !== "") {
        ctx.error(`Вызов SendMessage с path=${path} не реализован.`);
        return;
    }

    if (!ctx.canComputeClass) return;

    const current = ctx.currentClass;

    for (const other of ctx.project.getClassesByProtoName(className)) {
        if (other == current) continue;

        for (let i = 0; i < count; i += 2) {
            const idCurrent = (vars[i] = current.getVarId(<string>vars[i]));
            if (idCurrent == undefined) continue;
            const idOther = (vars[i + 1] = other.getVarId(<string>vars[i + 1]));
            if (idOther == undefined) continue;
            other.setNewVarValue(idOther, current.getNewVarValue(idCurrent));
        }

        other.compute(ctx, false);

        for (let i = 0; i < count; i += 2) {
            const idCurrent = <number | undefined>vars[i];
            const idOther = <number | undefined>vars[i + 1];
            if (idCurrent != undefined && idOther != undefined)
                current.setNewVarValue(idCurrent, other.getNewVarValue(idOther));
        }
    }
}

// V_REGISTEROBJECT, name "RegisterObject" arg "HANDLE","HANDLE","STRING","FLOAT","FLOAT" out 153
function RegisterObject(ctx: VmContext) {
    const flags = ctx.stackPop();
    const msg = ctx.stackPop();
    const path = ctx.stackPop();
    const objectHandle = ctx.stackPop();
    const hspaceOrWinName = ctx.stackPop();
    console.log(`RegisterObject(${hspaceOrWinName}, ${objectHandle}, "${path}", ${msg}, ${flags})`);
    return;
}

//V_GETCLASS, name "GetClassName" arg "STRING" ret "STRING" out 398
function GetClassName(ctx: VmContext) {
    const res = ctx.currentClass.getClassesByPath(<string>ctx.stackPop());
    ctx.stackPush(!res || Array.isArray(res) ? "" : res.protoName);
}

//NOTREL
// function VFUNCTION(ctx: IContext, data: VmFunctionOperand) {
//     const { funcName, argCount, returnType } = data;

//     for (let i = 0; i < argCount; i++) ctx.stackPop();

//     console.log("CALLING FUNCTION " + funcName);
//     if (returnType) ctx.stackPush("function_result");
//     // throw 'VUNFCTION NOT RELEASED'
// }

//NOTREL
// function DLLFUNCTION(ctx, _data) {
//     console.log(data);
//     throw "DLLFUNCTION: NIMP";
// }

// //NOTREL
// function CREATEGROUP2D(ctx, _word) {
//     const size = _word;
//     throw "CREATEGROUP_SIZE: NIMP";
// }

// //NOTREL
// function SETGROUPITEMS2D(ctx, _word) {
//     const size = _word;
//     throw "SETGROUPITEMS2D: NIMP";
// }

// //NOTREL
// function CREATEPOLYLINE2D(ctx, _word) {
//     const size = _word;
//     throw "CREATEPOLYLINE2D: NIMP";
// }

// function VM_ADDPRIMITIVE3D(ctx, _word) {
//     const size = _word;
//     throw "VM_ADDPRIMITIVE3D: NIMP";
// }

export function initAdvanced(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(Opcode.VM_SENDMESSAGE, SendMessage as Operation);
    addOperation(Opcode.V_REGISTEROBJECT, RegisterObject);
    addOperation(Opcode.V_GETCLASS, GetClassName);

    // addCommand(Opcode.VFUNCTION, VFUNCTION);
    // addCommand(Opcode.DLLFUNCTION, DLLFUNCTION);
    // addCommand(Opcode.CREATEGROUP2D, CREATEGROUP2D);
    // addCommand(Opcode.SETGROUPITEMS2D, SETGROUPITEMS2D);
    // addCommand(Opcode.CREATEPOLYLINE2D, CREATEPOLYLINE2D);
    // addCommand(Opcode.VM_ADDPRIMITIVE3D, VM_ADDPRIMITIVE3D);
}
