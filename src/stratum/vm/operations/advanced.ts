import { Operation, VmStateContainer } from "vm-types";
import { Opcode } from "~/helpers/vmConstants";

function SendMessage(ctx: VmStateContainer, count: number) {
    const vars = new Array<string>(count);
    const ids = new Uint16Array(count);
    let realCount = 0;
    for (let i = count - 1; i >= 0; i--) vars[i] = ctx.popString().toLowerCase();
    const className = ctx.popString();
    const path = ctx.popString();
    if (path !== "") {
        ctx.setError(`Вызов SendMessage с path=${path} не реализован.`);
        return;
    }

    if (!ctx.canExecuteClass) return;
    const nodes = ctx.project.getClassesByProtoName(className);
    if (nodes.length === 0) return;

    const current = ctx.currentClass;
    const mem = ctx.memoryState;

    for (let i = 0; i < count; i += 2) {
        const idCur = current.varnameToIdMap!.get(vars[i]);
        if (idCur === undefined) continue;
        ids[realCount] = idCur;
        const idOther = nodes[0].varnameToIdMap!.get(vars[i + 1]);
        if (idOther === undefined) continue;
        ids[realCount + 1] = idOther;
        realCount += 2;
    }

    for (let i = 0; i < nodes.length; i++) {
        const other = nodes[i];
        if (other === current) continue;

        for (let i = 0; i < realCount; i += 2) {
            const idCur = ids[i];
            const idOther = ids[i + 1];

            const currentId1 = current.doubleIdToGlobal![idCur];
            const otherId1 = other.doubleIdToGlobal![idOther];
            mem.newDoubleValues[otherId1] = mem.oldDoubleValues[otherId1] = mem.newDoubleValues[currentId1];

            const currentId2 = current.longIdToGlobal![idCur];
            const otherId2 = other.longIdToGlobal![idOther];
            mem.newLongValues[otherId2] = mem.oldLongValues[otherId2] = mem.newLongValues[currentId2];

            const currentId3 = current.stringIdToGlobal![idCur];
            const otherId3 = other.stringIdToGlobal![idOther];
            mem.newStringValues[otherId3] = mem.oldStringValues[otherId3] = mem.newStringValues[currentId3];
        }

        other.computeSchemeRecursive(ctx, true);

        for (let i = 0; i < count; i += 2) {
            const idCur = ids[i];
            const idOther = ids[i + 1];

            const currentId1 = current.doubleIdToGlobal![idCur];
            const otherId1 = other.doubleIdToGlobal![idOther];
            mem.newDoubleValues[currentId1] = mem.newDoubleValues[otherId1];

            const currentId2 = current.longIdToGlobal![idCur];
            const otherId2 = other.longIdToGlobal![idOther];
            mem.newLongValues[currentId2] = mem.newLongValues[otherId2];

            const currentId3 = current.stringIdToGlobal![idCur];
            const otherId3 = other.stringIdToGlobal![idOther];
            mem.newStringValues[currentId3] = mem.newStringValues[otherId3];
        }
    }
}

// V_REGISTEROBJECT, name "RegisterObject" arg "HANDLE","HANDLE","STRING","FLOAT","FLOAT" out 153
function RegisterObjectByGraphicSpace(ctx: VmStateContainer) {
    const flags = ctx.popDouble();
    const msg = ctx.popDouble();
    const path = ctx.popString();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    if (path !== "") {
        ctx.setError(`Вызов RegisterObject с path=${path} не реализован.`);
        return;
    }

    const space = ctx.graphics.getSpace(spaceHandle);
    if (space) space.subscribe(ctx, ctx.currentClass, msg, objectHandle, flags);

    //TODO: WTF???
    // console.log(`RegisterObjectBySpace(${spaceHandle}, ${objectHandle}, "${path}", ${msg}, ${flags})`);
}

//args: "STRING,HANDLE,STRING,FLOAT,FLOAT"
function RegisterObjectByWindowName(ctx: VmStateContainer) {
    const flags = ctx.popDouble();
    const msg = ctx.popDouble();
    const path = ctx.popString();
    const objectHandle = ctx.popLong();
    const windowName = ctx.popString();
    console.log(`RegisterObjectByWinname(${windowName}, ${objectHandle}, "${path}", ${msg}, ${flags})`);
}

//V_GETCLASS, name "GetClassName" arg "STRING" ret "STRING" out 398
function GetClassName(ctx: VmStateContainer) {
    const res = ctx.currentClass.getClassByPath(ctx.popString());
    ctx.pushString(res ? res.protoName : "");
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
// function SETGROUPITEMS2D(ctx, _word) {
//     const size = _word;
//     throw "SETGROUPITEMS2D: NIMP";
// }

// function VM_ADDPRIMITIVE3D(ctx, _word) {
//     const size = _word;
//     throw "VM_ADDPRIMITIVE3D: NIMP";
// }

function SetCapture(ctx: VmStateContainer) {
    const flags = ctx.popDouble();
    const path = ctx.popString();
    const spaceHandle = ctx.popLong();

    const obj = ctx.currentClass.getClassByPath(path);
    if (!obj) return;
    obj.startCaptureEvents(spaceHandle);
}

function ReleaseCapture(ctx: VmStateContainer) {
    ctx.currentClass.stopCaptureEvents();
}

function SetVarFloat(ctx: VmStateContainer) {
    const value = ctx.popDouble();
    const name = ctx.popString();
    const objectPath = ctx.popString();

    const obj = ctx.currentClass.getClassByPath(objectPath);
    if (!obj) return;
    const varId = obj.varnameToIdMap!.get(name.toLowerCase());
    if (varId === undefined) return;

    const realId = obj.doubleIdToGlobal![varId];
    ctx.memoryState.oldDoubleValues[realId] = value;
    ctx.memoryState.newDoubleValues[realId] = value;
}

export function initAdvanced(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(Opcode.VM_SENDMESSAGE, SendMessage as Operation);
    addOperation(Opcode.V_REGISTEROBJECT, RegisterObjectByGraphicSpace);
    addOperation(Opcode.REGISTEROBJECTS, RegisterObjectByWindowName);
    addOperation(Opcode.V_GETCLASS, GetClassName);
    addOperation(Opcode.V_SETCAPTURE, SetCapture);
    addOperation(Opcode.V_RELEASECAPTURE, ReleaseCapture);
    addOperation(Opcode.V_SETVARF, SetVarFloat);

    // addCommand(Opcode.VFUNCTION, VFUNCTION);
    // addCommand(Opcode.DLLFUNCTION, DLLFUNCTION);
    // addCommand(Opcode.SETGROUPITEMS2D, SETGROUPITEMS2D);
    // addCommand(Opcode.VM_ADDPRIMITIVE3D, VM_ADDPRIMITIVE3D);
}
