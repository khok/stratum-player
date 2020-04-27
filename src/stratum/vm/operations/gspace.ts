import { GroupObjectState } from "vm-interfaces-gspace";
import { Operation, VmStateContainer } from "vm-types";
import { Opcode } from "~/helpers/vmConstants";

function _getObject(ctx: VmStateContainer, spaceHandle: number, objectHandle: number) {
    const space = ctx.graphics.getSpace(spaceHandle);
    return space && space.getObject(objectHandle);
}

//args: "HANDLE,HANDLE,FLOAT ret FLOAT"
function SetShowObject2d(ctx: VmStateContainer) {
    const visibility = ctx.popDouble();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.setVisibility(visibility && 1) : 0);
}

// ShowObject2d(HANDLE HSpace, HANDLE HObject)
function ShowObject2d(ctx: VmStateContainer) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    if (obj) obj.setVisibility(1);
}

// HideObject2d(HANDLE HSpace, HANDLE HObject)
function HideObject2d(ctx: VmStateContainer) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    if (obj) obj.setVisibility(0);
}

// args: "HANDLE,HANDLE  ret HANDLE"
function GetObjectParent2d(ctx: VmStateContainer) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushLong(obj && obj.parent ? obj.parent.handle : 0);
}

//args: "HANDLE,HANDLE ret FLOAT "
function GetZOrder2d(ctx: VmStateContainer) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.zOrder : 0);
}

//args: "HANDLE,HANDLE ret FLOAT "
function SetZOrder2d(ctx: VmStateContainer) {
    const zOrder = ctx.popDouble();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.setZorder(zOrder) : 0);
}

//args: "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT  ret FLOAT";
function RotateObject2d(ctx: VmStateContainer) {
    const angle = ctx.popDouble();
    const centerY = ctx.popDouble();
    const centerX = ctx.popDouble();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.rotate(centerX, centerY, angle) : 0);
}

//SETOBJECTORG2D, name "SetObjectOrg2d"      arg "HANDLE","HANDLE","FLOAT","FLOAT"  ret "FLOAT" out 331
function SetObjectOrg2d(ctx: VmStateContainer) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.setPosition(x, y) : 0);
}

//"HANDLE,HANDLE,FLOAT,FLOAT  ret FLOAT"
function SetObjectSize2d(ctx: VmStateContainer) {
    const height = ctx.popDouble();
    const width = ctx.popDouble();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.setSize(width, height) : 0);
}

//GETOBJECTORG2DX, name "GetObjectOrg2dx"     arg "HANDLE","HANDLE"  ret "FLOAT" out 324
function GetObjectOrg2dx(ctx: VmStateContainer) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.positionX : 0);
}
//GETOBJECTORG2DY, name "GetObjectOrg2dy"     arg "HANDLE","HANDLE"  ret "FLOAT" out 325
function GetObjectOrg2dy(ctx: VmStateContainer) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.positionY : 0);
}
//GETOBJECTSIZE2DX, name "GetObjectWidth2d"    arg "HANDLE","HANDLE"  ret "FLOAT" out 328
function GetObjectWidth2d(ctx: VmStateContainer) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.width : 0);
}
//GETOBJECTSIZE2DY, name "GetObjectHeight2d"    arg "HANDLE","HANDLE"  ret "FLOAT" out 329
function GetObjectHeight2d(ctx: VmStateContainer) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.height : 0);
}

//GETOBJECTBYNAME, name "GetObject2dByName"   arg "HANDLE","HANDLE","STRING" ret "HANDLE" out 224
function GetObject2dByName(ctx: VmStateContainer) {
    const objectName = ctx.popString();
    const groupHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    if (objectName === "") {
        ctx.pushLong(0);
        return;
    }

    const space = ctx.graphics.getSpace(spaceHandle);
    if (!space) {
        ctx.pushLong(0);
        return;
    }

    let group: GroupObjectState | undefined;
    if (groupHandle) {
        const maybeGroup = space.getObject(groupHandle);
        if (!maybeGroup || maybeGroup.type !== "otGROUP2D") {
            ctx.pushLong(0);
            return;
        }
        group = maybeGroup;
    }
    const object = space.findObjectByName(objectName, group);
    ctx.pushLong(object ? object.handle : 0);
}

//GETOBJECTFROMPOINT2D, name "GetObjectFromPoint2d"  arg "HANDLE","FLOAT","FLOAT" ret "HANDLE" out 380
function GetObjectFromPoint2d(ctx: VmStateContainer) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const spaceHandle = ctx.popLong();
    const space = ctx.graphics.getSpace(spaceHandle);
    if (!space) {
        ctx.pushLong(0);
        return;
    }
    const obj = space.getObjectFromPoint(x, y);
    ctx.pushLong(obj ? obj.handle : 0);
}

//GETSPACEORGX, name "GetSpaceOrg2dx"        arg "HANDLE" ret "FLOAT" out 342
function GetSpaceOrg2dx(ctx: VmStateContainer) {
    const space = ctx.graphics.getSpace(ctx.popLong());
    ctx.pushDouble(space ? space.originX : 0);
}

//GETSPACEORGY, name "GetSpaceOrg2dy"        arg "HANDLE" ret "FLOAT" out 341
function GetSpaceOrg2dy(ctx: VmStateContainer) {
    const space = ctx.graphics.getSpace(ctx.popLong());
    ctx.pushDouble(space ? space.originY : 0);
}

//SETSPACEORG2D, name "SetSpaceOrg2d"         arg "HANDLE","FLOAT","FLOAT" ret "FLOAT" out 343
function SetSpaceOrg2d(ctx: VmStateContainer) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const spaceHandle = ctx.popLong();
    const space = ctx.graphics.getSpace(spaceHandle);
    ctx.pushDouble(space ? space.setOrigin(x, y) : 0);
}
//SETSCALESPACE2D, name "SetScaleSpace2d"       arg "HANDLE","FLOAT" ret "FLOAT" out 344
function SetScaleSpace2d(ctx: VmStateContainer) {
    const scale = ctx.popDouble();
    const spaceHandle = ctx.popLong();
    const space = ctx.graphics.getSpace(spaceHandle);
    ctx.pushDouble(space ? 1 : 0);
    // ctx.pushDouble(space ? space.setScale(scale) : 0);
}
//GETSCALESPACE2D, name "GetScaleSpace2d"       arg "HANDLE" ret "FLOAT" out 345
function GetScaleSpace2d(ctx: VmStateContainer) {
    const space = ctx.graphics.getSpace(ctx.popLong());
    // ctx.setError("GetScaleSpace2d не реализована");
    // return;
    ctx.pushDouble(space ? 1 : 0);
    // ctx.pushDouble(space ? space.scale : 0);
}

function GetActualWidth2d(ctx: VmStateContainer) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.width : 0);
}

function GetActualHeight2d(ctx: VmStateContainer) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.height : 0);
}

function DelGroupItem2d(ctx: VmStateContainer) {
    const objectHandle = ctx.popLong();
    const groupHandle = ctx.popLong(); //нахрена?
    const spaceHandle = ctx.popLong();

    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj && obj.parent ? obj.parent.removeItem(obj) : 0);
}

function SetControlText2d(ctx: VmStateContainer) {
    const text = ctx.popString();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj && obj.type === "otCONTROL2D" ? obj.setText(text) : 0);
}

function GetControlText2d(ctx: VmStateContainer) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushString(obj && obj.type === "otCONTROL2D" ? obj.text : "");
}

function SetBitmapSrcRect2d(ctx: VmStateContainer) {
    const height = ctx.popDouble();
    const width = ctx.popDouble();
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj && obj.type === "otBITMAP2D" ? obj.setRect(x, y, width, height) : 0);
}

function GetVectorPoint2dx(ctx: VmStateContainer) {
    const index = ctx.popDouble();
    const lineHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const obj = _getObject(ctx, spaceHandle, lineHandle);
    ctx.pushDouble(obj && obj.type === "otLINE2D" ? obj.getPoint(index).x : 0);
}

function GetVectorPoint2dy(ctx: VmStateContainer) {
    const index = ctx.popDouble();
    const lineHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const obj = _getObject(ctx, spaceHandle, lineHandle);
    ctx.pushDouble(obj && obj.type === "otLINE2D" ? obj.getPoint(index).y : 0);
}

function SetVectorPoint2d(ctx: VmStateContainer) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const index = ctx.popDouble();
    const lineHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const obj = _getObject(ctx, spaceHandle, lineHandle);
    ctx.pushDouble(obj && obj.type === "otLINE2D" ? obj.setPointPosition(index, x, y) : 0);
}

// FLOAT AddPoint2d(HANDLE HSpace, HANDLE HLine, FLOAT Numer, FLOAT x, FLOAT y)
function AddPoint2d(ctx: VmStateContainer) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const index = ctx.popDouble();
    const lineHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const obj = _getObject(ctx, spaceHandle, lineHandle);
    ctx.pushDouble(obj && obj.type === "otLINE2D" ? obj.addPoint(index, x, y) : 0);
}

// FLOAT IsObjectsIntersect2d(HANDLE HSpace, HANDLE obj1, HANDLE obj2, FLOAT flags)
function IsObjectsIntersect2d(ctx: VmStateContainer) {
    const flags = ctx.popDouble();
    const obj2Handle = ctx.popLong();
    const obj1Handle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const space = ctx.graphics.getSpace(spaceHandle);
    if (!space) {
        ctx.pushDouble(0);
        return;
    }
    const obj1 = space.getObject(obj1Handle);
    const obj2 = space.getObject(obj2Handle);
    ctx.pushDouble(obj1 && obj2 ? space.isIntersect(obj1, obj2) : 0);
}

// FLOAT SetObjectName2d(HANDLE HSpace, HANDLE HObject, STRING Name)
function SetObjectName2d(ctx: VmStateContainer) {
    const name = ctx.popString();
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.pushDouble(obj ? obj.setName(name) : 0);
}

// FLOAT ObjectToTop2d(HANDLE HSpace, HANDLE HObject)
function ObjectToTop2d(ctx: VmStateContainer) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.graphics.getSpace(spaceHandle);
    ctx.pushDouble(space ? space.moveObjectToTop(objectHandle) : 0);
}

// FLOAT GetActualSize2d(HANDLE HSpace2d, HANDLE HObject, &FLOAT x, &FLOAT y)
function GetActualSize2d(ctx: VmStateContainer) {
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
    const cl = ctx.currentClass;

    if (isXNew) ctx.memoryState.newDoubleValues[cl.doubleIdToGlobal![xId]] = x;
    else ctx.memoryState.oldDoubleValues[cl.doubleIdToGlobal![xId]] = x;
    if (isYNew) ctx.memoryState.newDoubleValues[cl.doubleIdToGlobal![yId]] = y;
    else ctx.memoryState.oldDoubleValues[cl.doubleIdToGlobal![yId]] = y;

    ctx.pushDouble(1);
}

// HANDLE GetGroupItem2d(HANDLE HSpace, HANDLE HGroup, FLOAT Number)
function GetGroupItem2d(ctx: VmStateContainer) {
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
function DeleteGroup2d(ctx: VmStateContainer) {
    const groupHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.graphics.getSpace(spaceHandle);
    ctx.pushDouble(space ? space.deleteGroup(groupHandle) : 0);
}

export function initGraphics(addOperation: (opcode: number, operation: Operation) => void) {
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
    addOperation(Opcode.SHOWOBJECT2D, ShowObject2d);
    addOperation(Opcode.HIDEOBJECT2D, HideObject2d);
    addOperation(Opcode.SETZORDER2D, SetZOrder2d);
    addOperation(Opcode.GETZORDER2D, GetZOrder2d);
    addOperation(Opcode.VM_GETACTUALWIDTH, GetActualWidth2d);
    addOperation(Opcode.VM_GETACTUALHEIGHT, GetActualHeight2d);
    addOperation(Opcode.DELGROUPITEM2D, DelGroupItem2d);
    addOperation(Opcode.VM_SETCONTROLTEXT, SetControlText2d);
    addOperation(Opcode.VM_GETCONTROLTEXT, GetControlText2d);
    addOperation(Opcode.SETBITMAPSRCRECT, SetBitmapSrcRect2d);
    addOperation(Opcode.GETVECTORPOINT2DX, GetVectorPoint2dx);
    addOperation(Opcode.GETVECTORPOINT2DY, GetVectorPoint2dy);
    addOperation(Opcode.SETVECTORPOINT2D, SetVectorPoint2d);
    addOperation(Opcode.ADDPOINT2D, AddPoint2d);
    addOperation(Opcode.V_ISINTERSECT2D, IsObjectsIntersect2d);
    addOperation(Opcode.SETOBJECTNAME2D, SetObjectName2d);
    addOperation(Opcode.OBJECTTOTOP2D, ObjectToTop2d);
    addOperation(Opcode.VM_GETACTUALSIZE, GetActualSize2d);
    addOperation(Opcode.GETGROUPITEM2D, GetGroupItem2d);
    addOperation(Opcode.DELETEGROUP2D, DeleteGroup2d);
}
