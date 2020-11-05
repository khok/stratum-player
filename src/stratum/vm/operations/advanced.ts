import { OpCode } from "../consts";
import { ExecutionContext } from "../executionContext";
import { FunctionSignature, Operation } from "../types";

function SendMessage(ctx: ExecutionContext, count: number) {
    const varNames = new Array<string>(count);
    let realCount = 0;
    for (let i = count - 1; i >= 0; i--) varNames[i] = ctx.popString().toLowerCase();
    const className = ctx.popString();
    const path = ctx.popString();
    if (path !== "") throw Error(`Вызов SendMessage с path=${path} не реализован.`);

    if (!ctx.canExecuteClass) return;
    const receivers = ctx.classManager.getClassesByProtoName(className);
    if (receivers.length === 0) return;

    const fistNodeVars = receivers[0].vars;
    if (!fistNodeVars) return;
    const senderVars = ctx.classVars;

    const ids = new Uint16Array(count);
    const targetValues = new Array<Float64Array | Int32Array | string[]>(count);
    const mem = ctx.memoryManager;

    for (let i = 0; i < count; i += 2) {
        const idCur = senderVars.nameToIdMap.get(varNames[i]);
        if (idCur === undefined) continue;
        const idOther = fistNodeVars.nameToIdMap.get(varNames[i + 1]);
        if (idOther === undefined) continue;

        const curType = senderVars.typeCodes[idCur];
        const otherType = fistNodeVars.typeCodes[idOther];

        if (curType !== otherType) throw Error("Инконсистентные типы связываемых переменных");

        ids[realCount] = senderVars.globalIds[idCur];
        ids[realCount + 1] = idOther;

        targetValues[realCount] = mem.getOldValues(curType);
        targetValues[realCount + 1] = mem.getNewValues(curType);
        realCount += 2;
    }

    for (let i = 0; i < receivers.length; i++) {
        const other = receivers[i];
        const otherVars = other.vars!;
        if (otherVars === senderVars) continue;

        for (let j = 0; j < realCount; j += 2) {
            const currentId = ids[j];
            const otherId = otherVars.globalIds[ids[j + 1]];

            const targetNewValues = targetValues[j + 1];
            const targetOldValues = targetValues[j]; // <----------- нужно ли использовать старые значения??
            targetOldValues[otherId] = targetNewValues[otherId] = targetNewValues[currentId];

            // mem.newDoubleValues[otherId] = mem.oldDoubleValues[otherId] = mem.newDoubleValues[currentId];

            // const otherId2 = otherVars.longIdMappingTable[idOther];
            // mem.newLongValues[otherId2] = mem.oldLongValues[otherId2] = mem.newLongValues[currentId2];

            // const otherId3 = otherVars.stringIdMappingTable[idOther];
            // mem.newStringValues[otherId3] = mem.oldStringValues[otherId3] = mem.newStringValues[currentId3];
        }

        other.compute(ctx, true);

        for (let j = 0; j < count; j += 2) {
            const currentId = ids[j];
            const otherId = otherVars.globalIds[ids[j + 1]];

            const targetNewValues = targetValues[j + 1];
            targetNewValues[currentId] = targetNewValues[otherId];

            // const currentId1 = curVars.doubleIdMappingTable[idCur];
            // const otherId1 = otherVars.doubleIdMappingTable[idOther];
            // mem.newDoubleValues[currentId1] = mem.newDoubleValues[otherId1];

            // const currentId2 = curVars.longIdMappingTable[idCur];
            // const otherId2 = otherVars.longIdMappingTable[idOther];
            // mem.newLongValues[currentId2] = mem.newLongValues[otherId2];

            // const currentId3 = curVars.stringIdMappingTable[idCur];
            // const otherId3 = otherVars.stringIdMappingTable[idOther];
            // mem.newStringValues[currentId3] = mem.newStringValues[otherId3];
        }
    }
}

// V_REGISTEROBJECT, name "RegisterObject" arg "HANDLE","HANDLE","STRING","FLOAT","FLOAT" out 153
function RegisterObjectByGraphicSpace(ctx: ExecutionContext) {
    const flags = ctx.popDouble();
    const eventCode = ctx.popDouble();
    const path = ctx.popString();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    if (path !== "") throw Error(`Вызов RegisterObject с path=${path} не реализован.`);

    const space = ctx.windows.getSpace(spaceHandle);
    if (space) space.subscribeToEvent(eventCode, objectHandle, flags, ctx);
}

//args: "STRING,HANDLE,STRING,FLOAT,FLOAT"
function RegisterObjectByWindowName(ctx: ExecutionContext) {
    const flags = ctx.popDouble();
    const msg = ctx.popDouble();
    const path = ctx.popString();
    const objectHandle = ctx.popLong();
    const windowName = ctx.popString();
    console.warn(`Не реализовано: RegisterObjectByWinname(${windowName}, ${objectHandle}, "${path}", ${msg}, ${flags})`);
}

//V_GETCLASS, name "GetClassName" arg "STRING" ret "STRING" out 398
function GetClassName(ctx: ExecutionContext) {
    const res = ctx.currentClass.getClassByPath(ctx.popString().toLowerCase());
    ctx.pushString(res ? res.protoName : "");
}

//NOTREL
function VFUNCTION(ctx: ExecutionContext, data: FunctionSignature) {
    // const { funcName, argCount, returnType, argTypes } = data;
    if (data) console.log(data);
    throw Error("Вызов пользовательских функций не реализован");
}

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

function SetCapture(ctx: ExecutionContext) {
    const flags = ctx.popDouble();
    const path = ctx.popString();
    const spaceHandle = ctx.popLong();

    const obj = ctx.currentClass.getClassByPath(path.toLowerCase());
    if (!obj) return;
    obj.startCaptureEvents(spaceHandle);
}

function ReleaseCapture(ctx: ExecutionContext) {
    ctx.currentClass.stopCaptureEvents();
}

function SetVarFloat(ctx: ExecutionContext) {
    const value = ctx.popDouble();
    const name = ctx.popString();
    const objectPath = ctx.popString();

    const obj = ctx.currentClass.getClassByPath(objectPath.toLowerCase());
    if (obj === undefined || obj.vars === undefined) return;
    const varId = obj.vars.nameToIdMap.get(name.toLowerCase());
    if (varId === undefined) return;

    const realId = obj.vars.globalIds[varId];
    ctx.memoryManager.oldDoubleValues[realId] = value;
    ctx.memoryManager.newDoubleValues[realId] = value;
}

function GetVarColorref(ctx: ExecutionContext) {
    const name = ctx.popString();
    const objectPath = ctx.popString();

    const obj = ctx.currentClass.getClassByPath(objectPath.toLowerCase());
    if (obj === undefined || obj.vars === undefined) return;
    const varId = obj.vars.nameToIdMap.get(name.toLowerCase());
    if (varId === undefined) return;

    const realId = obj.vars.globalIds[varId];
    ctx.pushLong(ctx.memoryManager.newLongValues[realId]);
}

export function initAdvanced(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(OpCode.VM_SENDMESSAGE, SendMessage as Operation);
    addOperation(OpCode.V_REGISTEROBJECT, RegisterObjectByGraphicSpace);
    addOperation(OpCode.REGISTEROBJECTS, RegisterObjectByWindowName);
    addOperation(OpCode.V_GETCLASS, GetClassName);
    addOperation(OpCode.V_SETCAPTURE, SetCapture);
    addOperation(OpCode.V_RELEASECAPTURE, ReleaseCapture);
    addOperation(OpCode.V_SETVARF, SetVarFloat);
    addOperation(OpCode.V_GETVARH, GetVarColorref);

    addOperation(OpCode.VFUNCTION, VFUNCTION as Operation);
    // addCommand(Opcode.DLLFUNCTION, DLLFUNCTION);
    // addCommand(Opcode.SETGROUPITEMS2D, SETGROUPITEMS2D);
    // addCommand(Opcode.VM_ADDPRIMITIVE3D, VM_ADDPRIMITIVE3D);
}
