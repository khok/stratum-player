import { Opcode } from "../opcode";
import { Operation, VmContext } from "../types";

function getObject(ctx: VmContext, spaceHandle: number, objectHandle: number) {
    const space = ctx.windows.getSpace(spaceHandle);
    return space && space.getObject(objectHandle);
}

//args: "HANDLE,HANDLE,FLOAT ret FLOAT"
function SetShowObject2d(ctx: VmContext) {
    const visibility = <number>ctx.stackPop();
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.setVisibility(visibility && 1) : 0);
}

// args: "HANDLE,HANDLE  ret HANDLE"
function GetObjectParent2d(ctx: VmContext) {
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.parentHandle : 0);
}

//args: "HANDLE,HANDLE ret FLOAT "
function GetZOrder2d(ctx: VmContext) {
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.zOrder : 0);
}

//args: "HANDLE,HANDLE ret FLOAT "
function SetZOrder2d(ctx: VmContext) {
    const zOrder = <number>ctx.stackPop();
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.setZOrder(zOrder) : 0);
}

args: "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT  ret FLOAT";
function RotateObject2d(ctx: VmContext) {
    const angle = <number>ctx.stackPop();
    const centerY = <number>ctx.stackPop();
    const centerX = <number>ctx.stackPop();
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.rotate(centerX, centerY, angle) : 0);
}

//SETOBJECTORG2D, name "SetObjectOrg2d"      arg "HANDLE","HANDLE","FLOAT","FLOAT"  ret "FLOAT" out 331
function SetObjectOrg2d(ctx: VmContext) {
    const y = <number>ctx.stackPop();
    const x = <number>ctx.stackPop();
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.setPosition(x, y) : 0);
}

//"HANDLE,HANDLE,FLOAT,FLOAT  ret FLOAT"
function SetObjectSize2d(ctx: VmContext) {
    const height = <number>ctx.stackPop();
    const width = <number>ctx.stackPop();
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.setSize(width, height) : 0);
}

//GETOBJECTORG2DX, name "GetObjectOrg2dx"     arg "HANDLE","HANDLE"  ret "FLOAT" out 324
function GetObjectOrg2dx(ctx: VmContext) {
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.positionX : 0);
}
//GETOBJECTORG2DY, name "GetObjectOrg2dy"     arg "HANDLE","HANDLE"  ret "FLOAT" out 325
function GetObjectOrg2dy(ctx: VmContext) {
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.positionY : 0);
}
//GETOBJECTSIZE2DX, name "GetObjectWidth2d"    arg "HANDLE","HANDLE"  ret "FLOAT" out 328
function GetObjectWidth2d(ctx: VmContext) {
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.width : 0);
}
//GETOBJECTSIZE2DY, name "GetObjectHeight2d"    arg "HANDLE","HANDLE"  ret "FLOAT" out 329
function GetObjectHeight2d(ctx: VmContext) {
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.height : 0);
}

//GETOBJECTBYNAME, name "GetObject2dByName"   arg "HANDLE","HANDLE","STRING" ret "HANDLE" out 224
function GetObject2dByName(ctx: VmContext) {
    const objectName = <string>ctx.stackPop();
    const groupHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? space.findObjectHandleByName(groupHandle, objectName) : 0);
}

//GETOBJECTFROMPOINT2D, name "GetObjectFromPoint2d"  arg "HANDLE","FLOAT","FLOAT" ret "HANDLE" out 380
function GetObjectFromPoint2d(ctx: VmContext) {
    const y = <number>ctx.stackPop();
    const x = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? space.getObjectHandleFromPoint(x, y) : 0);
}

//GETSPACEORGX, name "GetSpaceOrg2dx"        arg "HANDLE" ret "FLOAT" out 342
function GetSpaceOrg2dx(ctx: VmContext) {
    const space = ctx.windows.getSpace(<number>ctx.stackPop());
    ctx.stackPush(space ? space.originX : 0);
}

//GETSPACEORGY, name "GetSpaceOrg2dy"        arg "HANDLE" ret "FLOAT" out 341
function GetSpaceOrg2dy(ctx: VmContext) {
    const space = ctx.windows.getSpace(<number>ctx.stackPop());
    ctx.stackPush(space ? space.originY : 0);
}

//SETSPACEORG2D, name "SetSpaceOrg2d"         arg "HANDLE","FLOAT","FLOAT" ret "FLOAT" out 343
function SetSpaceOrg2d(ctx: VmContext) {
    const y = <number>ctx.stackPop();
    const x = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? space.setOrigin(x, y) : 0);
}
//SETSCALESPACE2D, name "SetScaleSpace2d"       arg "HANDLE","FLOAT" ret "FLOAT" out 344
function SetScaleSpace2d(ctx: VmContext) {
    const scale = <number>ctx.stackPop();
    const hspace = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(hspace);
    ctx.stackPush(space ? 1 : 0);
    // ctx.stackPush(space ? space.setScale(scale) : 0);
}
//GETSCALESPACE2D, name "GetScaleSpace2d"       arg "HANDLE" ret "FLOAT" out 345
function GetScaleSpace2d(ctx: VmContext) {
    const space = ctx.windows.getSpace(<number>ctx.stackPop());
    // ctx.error("GetScaleSpace2d не реализована");
    // return;
    ctx.stackPush(space ? 1 : 0);
    // ctx.stackPush(space ? space.scale : 0);
}

export function initGraphicSpace(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(Opcode.GETOBJECTBYNAME, GetObject2dByName);
    addOperation(Opcode.SETOBJECTORG2D, SetObjectOrg2d);
    addOperation(Opcode.GETOBJECTFROMPOINT2D, GetObjectFromPoint2d);
    addOperation(Opcode.GETOBJECTORG2DX, GetObjectOrg2dx);
    addOperation(Opcode.GETOBJECTORG2DY, GetObjectOrg2dy);
    addOperation(Opcode.GETOBJECTSIZE2DX, GetObjectWidth2d);
    addOperation(Opcode.GETOBJECTSIZE2DY, GetObjectHeight2d);
    addOperation(Opcode.GETSPACEORGY, GetSpaceOrg2dy);
    addOperation(Opcode.GETSPACEORGX, GetSpaceOrg2dx);
    addOperation(Opcode.SETSPACEORG2D, SetSpaceOrg2d);
    addOperation(Opcode.SETSCALESPACE2D, SetScaleSpace2d);
    addOperation(Opcode.GETSCALESPACE2D, GetScaleSpace2d);
    addOperation(Opcode.GETOBJECTPARENT2D, GetObjectParent2d);
    addOperation(Opcode.ROTATEOBJECT2D, RotateObject2d);
    addOperation(Opcode.SETOBJECTSIZE2D, SetObjectSize2d);
    addOperation(Opcode.SETSHOWOBJECT2D, SetShowObject2d);
    addOperation(Opcode.SETZORDER2D, SetZOrder2d);
    addOperation(Opcode.GETZORDER2D, GetZOrder2d);
}
