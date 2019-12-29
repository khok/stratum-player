import { Operation, VmStateContainer } from "vm-types";
import { Opcode } from "~/helpers/vm";

function SendMessage(ctx: VmStateContainer, count: number) {
    const vars = new Array<string>(count);
    for (let i = count - 1; i >= 0; i--) vars[i] = (<string>ctx.stackPop()).toLowerCase();
    const className = <string>ctx.stackPop();
    const path = <string>ctx.stackPop();
    if (path !== "") {
        ctx.setError(`Вызов SendMessage с path=${path} не реализован.`);
        return;
    }

    if (!ctx.canExecuteClass) return;

    const current = ctx.currentClass;

    for (const other of ctx.project.getClassesByProtoName(className)) {
        if (other === current) continue;

        for (let i = 0; i < count; i += 2) {
            const idCurrent = current.getVarIdLowCase(<string>vars[i]) as number;
            const idOther = other.getVarIdLowCase(<string>vars[i + 1]) as number;
            if (idCurrent > -1 && idOther > -1) {
                const curValue = current.getNewVarValue(idCurrent);
                other.setOldVarValue(idOther, curValue);
                other.setNewVarValue(idOther, curValue);
            }
        }

        if (!other.computeSchemeRecursive(ctx, false)) return;

        for (let i = 0; i < count; i += 2) {
            const idCurrent = current.getVarIdLowCase(<string>vars[i]) as number;
            const idOther = other.getVarIdLowCase(<string>vars[i + 1]) as number;
            if (idCurrent > -1 && idOther > -1) {
                const otherValue = other.getNewVarValue(idOther);
                current.setNewVarValue(idCurrent, otherValue);
            }
        }
    }
}

// V_REGISTEROBJECT, name "RegisterObject" arg "HANDLE","HANDLE","STRING","FLOAT","FLOAT" out 153
function RegisterObjectByGraphicSpace(ctx: VmStateContainer) {
    const flags = ctx.stackPop() as number;
    const msg = ctx.stackPop() as number;
    const path = ctx.stackPop() as string;
    const objectHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;
    //TODO: WTF???
    // console.log(`RegisterObjectBySpace(${spaceHandle}, ${objectHandle}, "${path}", ${msg}, ${flags})`);
}

//args: "STRING,HANDLE,STRING,FLOAT,FLOAT"
function RegisterObjectByWindowName(ctx: VmStateContainer) {
    const flags = ctx.stackPop() as number;
    const msg = ctx.stackPop() as number;
    const path = ctx.stackPop() as string;
    const objectHandle = ctx.stackPop() as number;
    const windowName = ctx.stackPop() as string;
    console.log(`RegisterObjectByWinname(${windowName}, ${objectHandle}, "${path}", ${msg}, ${flags})`);
}

//V_GETCLASS, name "GetClassName" arg "STRING" ret "STRING" out 398
function GetClassName(ctx: VmStateContainer) {
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
    addOperation(Opcode.V_REGISTEROBJECT, RegisterObjectByGraphicSpace);
    addOperation(Opcode.REGISTEROBJECTS, RegisterObjectByWindowName);
    addOperation(Opcode.V_GETCLASS, GetClassName);

    // addCommand(Opcode.VFUNCTION, VFUNCTION);
    // addCommand(Opcode.DLLFUNCTION, DLLFUNCTION);
    // addCommand(Opcode.CREATEGROUP2D, CREATEGROUP2D);
    // addCommand(Opcode.SETGROUPITEMS2D, SETGROUPITEMS2D);
    // addCommand(Opcode.CREATEPOLYLINE2D, CREATEPOLYLINE2D);
    // addCommand(Opcode.VM_ADDPRIMITIVE3D, VM_ADDPRIMITIVE3D);
}
