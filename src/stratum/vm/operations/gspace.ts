import { OpCode } from "../consts";
import { ExecutionContext } from "../executionContext";
import { Operation } from "../types";

function _getObject(ctx: ExecutionContext, spaceHandle: number, objectHandle: number) {
    const space = ctx.windows.getSpace(spaceHandle);
    return space && space.getObject(objectHandle);
}

//args: "HANDLE,HANDLE,FLOAT ret FLOAT"
function SetShowObject2d(ctx: ExecutionContext) {
    const visibility = ctx.popDouble();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.setVisibility(visibility && 1) : 0);
}

// ShowObject2d(HANDLE HSpace, HANDLE HObject)
function ShowObject2d(ctx: ExecutionContext) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    if (obj) obj.setVisibility(1);
}

// HideObject2d(HANDLE HSpace, HANDLE HObject)
function HideObject2d(ctx: ExecutionContext) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    if (obj) obj.setVisibility(0);
}

// args: "HANDLE,HANDLE  ret HANDLE"
function GetObjectParent2d(ctx: ExecutionContext) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushLong(obj && obj.parent ? obj.parent.handle : 0);
}

//args: "HANDLE,HANDLE ret FLOAT "
function GetZOrder2d(ctx: ExecutionContext) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.zOrder : 0);
}

//args: "HANDLE,HANDLE ret FLOAT "
function SetZOrder2d(ctx: ExecutionContext) {
    const zOrder = ctx.popDouble();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.setZorder(zOrder) : 0);
}

//args: "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT  ret FLOAT";
function RotateObject2d(ctx: ExecutionContext) {
    const angle = ctx.popDouble();
    const centerY = ctx.popDouble();
    const centerX = ctx.popDouble();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.rotate(centerX, centerY, angle) : 0);
}

//SETOBJECTORG2D, name "SetObjectOrg2d"      arg "HANDLE","HANDLE","FLOAT","FLOAT"  ret "FLOAT" out 331
function SetObjectOrg2d(ctx: ExecutionContext) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.setPosition(x, y) : 0);
}

//"HANDLE,HANDLE,FLOAT,FLOAT  ret FLOAT"
function SetObjectSize2d(ctx: ExecutionContext) {
    const height = ctx.popDouble();
    const width = ctx.popDouble();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.setSize(width, height) : 0);
}

//GETOBJECTORG2DX, name "GetObjectOrg2dx"     arg "HANDLE","HANDLE"  ret "FLOAT" out 324
function GetObjectOrg2dx(ctx: ExecutionContext) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.positionX : 0);
}
//GETOBJECTORG2DY, name "GetObjectOrg2dy"     arg "HANDLE","HANDLE"  ret "FLOAT" out 325
function GetObjectOrg2dy(ctx: ExecutionContext) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.positionY : 0);
}
//GETOBJECTSIZE2DX, name "GetObjectWidth2d"    arg "HANDLE","HANDLE"  ret "FLOAT" out 328
function GetObjectWidth2d(ctx: ExecutionContext) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.width : 0);
}
//GETOBJECTSIZE2DY, name "GetObjectHeight2d"    arg "HANDLE","HANDLE"  ret "FLOAT" out 329
function GetObjectHeight2d(ctx: ExecutionContext) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.height : 0);
}

//GETOBJECTBYNAME, name "GetObject2dByName"   arg "HANDLE","HANDLE","STRING" ret "HANDLE" out 224
function GetObject2dByName(ctx: ExecutionContext) {
    const objectName = ctx.popString();
    const groupHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    if (objectName === "") {
        ctx.pushLong(0);
        return;
    }

    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.pushLong(0);
        return;
    }

    // let group: GroupObjectState | undefined;
    // if (groupHandle) {
    //     const maybeGroup = space.getObject(groupHandle);
    //     if (!maybeGroup || maybeGroup.type !== "otGROUP2D") {
    //         ctx.pushLong(0);
    //         return;
    //     }
    //     group = maybeGroup;
    // }
    const object = space.findObjectByName(objectName, groupHandle);
    ctx.pushLong(object ? object.handle : 0);
}

//GETOBJECTFROMPOINT2D, name "GetObjectFromPoint2d"  arg "HANDLE","FLOAT","FLOAT" ret "HANDLE" out 380
function GetObjectFromPoint2d(ctx: ExecutionContext) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const spaceHandle = ctx.popLong();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.pushLong(0);
        return;
    }
    const obj = space.getObjectFromPoint(x, y);
    ctx.pushLong(obj ? obj.handle : 0);
}

//GETSPACEORGX, name "GetSpaceOrg2dx"        arg "HANDLE" ret "FLOAT" out 342
function GetSpaceOrg2dx(ctx: ExecutionContext) {
    const space = ctx.windows.getSpace(ctx.popLong());
    ctx.pushDouble(space ? space.originX : 0);
}

//GETSPACEORGY, name "GetSpaceOrg2dy"        arg "HANDLE" ret "FLOAT" out 341
function GetSpaceOrg2dy(ctx: ExecutionContext) {
    const space = ctx.windows.getSpace(ctx.popLong());
    ctx.pushDouble(space ? space.originY : 0);
}

//SETSPACEORG2D, name "SetSpaceOrg2d"         arg "HANDLE","FLOAT","FLOAT" ret "FLOAT" out 343
function SetSpaceOrg2d(ctx: ExecutionContext) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const spaceHandle = ctx.popLong();
    const space = ctx.windows.getSpace(spaceHandle);
    ctx.pushDouble(space ? space.setOrigin(x, y) : 0);
}
//SETSCALESPACE2D, name "SetScaleSpace2d"       arg "HANDLE","FLOAT" ret "FLOAT" out 344
function SetScaleSpace2d(ctx: ExecutionContext) {
    const scale = ctx.popDouble();
    const spaceHandle = ctx.popLong();
    const space = ctx.windows.getSpace(spaceHandle);
    ctx.pushDouble(space ? 1 : 0);
    // ctx.pushDouble(space ? space.setScale(scale) : 0);
}
//GETSCALESPACE2D, name "GetScaleSpace2d"       arg "HANDLE" ret "FLOAT" out 345
function GetScaleSpace2d(ctx: ExecutionContext) {
    const space = ctx.windows.getSpace(ctx.popLong());
    ctx.pushDouble(space ? 1 : 0);
    // ctx.pushDouble(space ? space.scale : 0);
}

function GetActualWidth2d(ctx: ExecutionContext) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.width : 0);
}

function GetActualHeight2d(ctx: ExecutionContext) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.height : 0);
}

function DelGroupItem2d(ctx: ExecutionContext) {
    const objectHandle = ctx.popLong();
    const groupHandle = ctx.popLong(); //нахрена?
    const spaceHandle = ctx.popLong();

    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj && obj.parent ? obj.parent.removeItem(obj) : 0);
}

function SetControlText2d(ctx: ExecutionContext) {
    const text = ctx.popString();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj && obj.type === "otCONTROL2D" ? obj.setText(text) : 0);
}

function GetControlText2d(ctx: ExecutionContext) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushString(obj && obj.type === "otCONTROL2D" ? obj.text : "");
}

function SetBitmapSrcRect2d(ctx: ExecutionContext) {
    const height = ctx.popDouble();
    const width = ctx.popDouble();
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj && (obj.type === "otBITMAP2D" || obj.type === "otDOUBLEBITMAP2D") ? obj.setRect(x, y, width, height) : 0);
}

function GetVectorPoint2dx(ctx: ExecutionContext) {
    const index = ctx.popDouble();
    const lineHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const obj = _getObject(ctx, spaceHandle, lineHandle);
    ctx.pushDouble(obj && obj.type === "otLINE2D" ? obj.getPoint(index).x : 0);
}

function GetVectorPoint2dy(ctx: ExecutionContext) {
    const index = ctx.popDouble();
    const lineHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const obj = _getObject(ctx, spaceHandle, lineHandle);
    ctx.pushDouble(obj && obj.type === "otLINE2D" ? obj.getPoint(index).y : 0);
}

function SetVectorPoint2d(ctx: ExecutionContext) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const index = ctx.popDouble();
    const lineHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const obj = _getObject(ctx, spaceHandle, lineHandle);
    ctx.pushDouble(obj && obj.type === "otLINE2D" ? obj.setPointPosition(index, x, y) : 0);
}

// FLOAT AddPoint2d(HANDLE HSpace, HANDLE HLine, FLOAT Numer, FLOAT x, FLOAT y)
function AddPoint2d(ctx: ExecutionContext) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const index = ctx.popDouble();
    const lineHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const obj = _getObject(ctx, spaceHandle, lineHandle);
    ctx.pushDouble(obj && obj.type === "otLINE2D" ? obj.addPoint(index, x, y) : 0);
}

// FLOAT IsObjectsIntersect2d(HANDLE HSpace, HANDLE obj1, HANDLE obj2, FLOAT flags)
function IsObjectsIntersect2d(ctx: ExecutionContext) {
    const flags = ctx.popDouble();
    const obj2Handle = ctx.popLong();
    const obj1Handle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const space = ctx.windows.getSpace(spaceHandle);

    ctx.pushDouble(space ? space.isIntersect(obj1Handle, obj2Handle) : 0);
}

// FLOAT SetObjectName2d(HANDLE HSpace, HANDLE HObject, STRING Name)
function SetObjectName2d(ctx: ExecutionContext) {
    const name = ctx.popString();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.setName(name) : 0);
}

// FLOAT ObjectToTop2d(HANDLE HSpace, HANDLE HObject)
function ObjectToTop2d(ctx: ExecutionContext) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    ctx.pushDouble(space ? space.moveObjectToTop(objectHandle) : 0);
}

// FLOAT GetActualSize2d(HANDLE HSpace2d, HANDLE HObject, &FLOAT x, &FLOAT y)
function GetActualSize2d(ctx: ExecutionContext) {
    const isYNew = ctx.popLong();
    const yId = ctx.popLong();
    const isXNew = ctx.popLong();
    const xId = ctx.popLong();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const obj = _getObject(ctx, spaceHandle, objectHandle);
    if (!obj) {
        ctx.pushDouble(0);
        return;
    }

    const x = obj.width;
    const y = obj.height;
    const vars = ctx.classVars;

    if (isXNew) ctx.memoryManager.newDoubleValues[vars.globalIds[xId]] = x;
    else ctx.memoryManager.oldDoubleValues[vars.globalIds[xId]] = x;
    if (isYNew) ctx.memoryManager.newDoubleValues[vars.globalIds[yId]] = y;
    else ctx.memoryManager.oldDoubleValues[vars.globalIds[yId]] = y;

    ctx.pushDouble(1);
}

// HANDLE GetGroupItem2d(HANDLE HSpace, HANDLE HGroup, FLOAT Number)
function GetGroupItem2d(ctx: ExecutionContext) {
    const index = ctx.popDouble();
    const groupHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const group = _getObject(ctx, spaceHandle, groupHandle);
    if (!group || group.type !== "otGROUP2D") {
        ctx.pushLong(0);
        return;
    }
    const obj = group.getItem(index);
    ctx.pushLong(obj ? obj.handle : 0);
}

// FLOAT DeleteGroup2d(HANDLE HSpace, HANDLE HGroup)
function DeleteGroup2d(ctx: ExecutionContext) {
    const groupHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    ctx.pushDouble(space ? space.deleteGroup(groupHandle) : 0);
}

export function initGraphics(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(OpCode.GETOBJECTBYNAME, GetObject2dByName);
    addOperation(OpCode.SETOBJECTORG2D, SetObjectOrg2d);
    addOperation(OpCode.GETOBJECTFROMPOINT2D, GetObjectFromPoint2d);
    addOperation(OpCode.GETOBJECTORG2DX, GetObjectOrg2dx);
    addOperation(OpCode.GETOBJECTORG2DY, GetObjectOrg2dy);
    addOperation(OpCode.GETOBJECTSIZE2DX, GetObjectWidth2d);
    addOperation(OpCode.GETOBJECTSIZE2DY, GetObjectHeight2d);
    addOperation(OpCode.GETSPACEORGY, GetSpaceOrg2dy);
    addOperation(OpCode.GETSPACEORGX, GetSpaceOrg2dx);
    addOperation(OpCode.SETSPACEORG2D, SetSpaceOrg2d);
    addOperation(OpCode.SETSCALESPACE2D, SetScaleSpace2d);
    addOperation(OpCode.GETSCALESPACE2D, GetScaleSpace2d);
    addOperation(OpCode.GETOBJECTPARENT2D, GetObjectParent2d);
    addOperation(OpCode.ROTATEOBJECT2D, RotateObject2d);
    addOperation(OpCode.SETOBJECTSIZE2D, SetObjectSize2d);
    addOperation(OpCode.SETSHOWOBJECT2D, SetShowObject2d);
    addOperation(OpCode.SHOWOBJECT2D, ShowObject2d);
    addOperation(OpCode.HIDEOBJECT2D, HideObject2d);
    addOperation(OpCode.SETZORDER2D, SetZOrder2d);
    addOperation(OpCode.GETZORDER2D, GetZOrder2d);
    addOperation(OpCode.VM_GETACTUALWIDTH, GetActualWidth2d);
    addOperation(OpCode.VM_GETACTUALHEIGHT, GetActualHeight2d);
    addOperation(OpCode.DELGROUPITEM2D, DelGroupItem2d);
    addOperation(OpCode.VM_SETCONTROLTEXT, SetControlText2d);
    addOperation(OpCode.VM_GETCONTROLTEXT, GetControlText2d);
    addOperation(OpCode.SETBITMAPSRCRECT, SetBitmapSrcRect2d);
    addOperation(OpCode.GETVECTORPOINT2DX, GetVectorPoint2dx);
    addOperation(OpCode.GETVECTORPOINT2DY, GetVectorPoint2dy);
    addOperation(OpCode.SETVECTORPOINT2D, SetVectorPoint2d);
    addOperation(OpCode.ADDPOINT2D, AddPoint2d);
    addOperation(OpCode.V_ISINTERSECT2D, IsObjectsIntersect2d);
    addOperation(OpCode.SETOBJECTNAME2D, SetObjectName2d);
    addOperation(OpCode.OBJECTTOTOP2D, ObjectToTop2d);
    addOperation(OpCode.VM_GETACTUALSIZE, GetActualSize2d);
    addOperation(OpCode.GETGROUPITEM2D, GetGroupItem2d);
    addOperation(OpCode.DELETEGROUP2D, DeleteGroup2d);
}
