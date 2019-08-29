import { VmCommand } from ".";
import { Opcode, IVirtualMachine } from "..";

function SendMessage(vm: IVirtualMachine, count: number) {
    const vars = new Array<string | number | undefined>(count);
    for (let i = count - 1; i >= 0; i--) vars[i] = <string>vm.stackPop();

    if (!vm.canComputeClass) return;

    const className = <string>vm.stackPop();
    const path = <string>vm.stackPop();
    // console.log(`sendMessage("${path}", "${className}", ${vars})`);
    // return;
    if (path !== "") throw "not released yet";

    const current = vm.currentClass;

    for (const other of vm.project.getClassesByProtoName(className)) {
        if (other == current) continue;
        for (let i = 0; i < count; i += 2) {
            // console.log(vars[i], vars[i + 1]);
            const idCurrent = (vars[i] = current.getVarIdByName(<string>vars[i]));
            if (idCurrent == undefined) continue;
            const idOther = (vars[i + 1] = other.getVarIdByName(<string>vars[i + 1]));
            if (idOther == undefined) continue;
            // console.log(vars[i], vars[i + 1]);
            other.setNewVarValue(idOther, current.getNewVarValue(idCurrent));
        }
        other.compute(vm, false);
        for (let i = 0; i < count; i += 2) {
            const vCur = vars[i];
            const vOther = vars[i + 1];
            if (vCur != undefined && vOther != undefined)
                current.setNewVarValue(<number>vCur, other.getNewVarValue(<number>vOther));
        }
    }
}

// V_REGISTEROBJECT, name "RegisterObject" arg "HANDLE","HANDLE","STRING","FLOAT","FLOAT" out 153
function RegisterObject(vm: IVirtualMachine) {
    const flags = vm.stackPop();
    const msg = vm.stackPop();
    const path = vm.stackPop();
    const objectHandle = vm.stackPop();
    const hspaceOrWinName = vm.stackPop();
    console.log(`RegisterObject(${hspaceOrWinName}, ${objectHandle}, "${path}", ${msg}, ${flags})`);
    return;
}

//V_GETCLASS, name "GetClassName" arg "STRING" ret "STRING" out 398
function GetClassName(vm: IVirtualMachine) {
    const res = vm.currentClass.getClassesByPath(<string>vm.stackPop());
    vm.stackPush(!res || Array.isArray(res) ? "" : res.protoName);
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

export default function init(addCommand: (opcode: number, command: VmCommand) => void) {
    addCommand(Opcode.VM_SENDMESSAGE, SendMessage);
    addCommand(Opcode.V_REGISTEROBJECT, RegisterObject);
    addCommand(Opcode.V_GETCLASS, GetClassName);

    // addCommand(Opcode.VFUNCTION, VFUNCTION);
    // addCommand(Opcode.DLLFUNCTION, DLLFUNCTION);
    // addCommand(Opcode.CREATEGROUP2D, CREATEGROUP2D);
    // addCommand(Opcode.SETGROUPITEMS2D, SETGROUPITEMS2D);
    // addCommand(Opcode.CREATEPOLYLINE2D, CREATEPOLYLINE2D);
    // addCommand(Opcode.VM_ADDPRIMITIVE3D, VM_ADDPRIMITIVE3D);
}
