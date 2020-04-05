import { Operation, VmStateContainer } from "vm-types";
import { Opcode } from "~/helpers/vmConstants";
import { GroupObjectState } from "vm-interfaces-graphics";

function _getObject(ctx: VmStateContainer, spaceHandle: number, objectHandle: number) {
    const space = ctx.windows.getSpace(spaceHandle);
    return space && space.getObject(objectHandle);
}

//args: "HANDLE,HANDLE,FLOAT ret FLOAT"
function SetShowObject2d(ctx: VmStateContainer) {
    const visibility = <number>ctx.stackPop();
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    if (obj) obj.isVisible = visibility && 1;
    ctx.stackPush(obj ? 1 : 0);
}

// args: "HANDLE,HANDLE  ret HANDLE"
function GetObjectParent2d(ctx: VmStateContainer) {
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj && obj.parent ? obj.parent.handle : 0);
}

//args: "HANDLE,HANDLE ret FLOAT "
function GetZOrder2d(ctx: VmStateContainer) {
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.zOrder : 0);
}

//args: "HANDLE,HANDLE ret FLOAT "
function SetZOrder2d(ctx: VmStateContainer) {
    const zOrder = <number>ctx.stackPop();
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    if (obj) obj.zOrder = zOrder;
    ctx.stackPush(obj ? 1 : 0);
}

//args: "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT  ret FLOAT";
function RotateObject2d(ctx: VmStateContainer) {
    const angle = <number>ctx.stackPop();
    const centerY = <number>ctx.stackPop();
    const centerX = <number>ctx.stackPop();
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.rotate(centerX, centerY, angle) : 0);
}

//SETOBJECTORG2D, name "SetObjectOrg2d"      arg "HANDLE","HANDLE","FLOAT","FLOAT"  ret "FLOAT" out 331
function SetObjectOrg2d(ctx: VmStateContainer) {
    const y = <number>ctx.stackPop();
    const x = <number>ctx.stackPop();
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.setPosition(x, y) : 0);
}

//"HANDLE,HANDLE,FLOAT,FLOAT  ret FLOAT"
function SetObjectSize2d(ctx: VmStateContainer) {
    const height = <number>ctx.stackPop();
    const width = <number>ctx.stackPop();
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.setSize(width, height) : 0);
}

//GETOBJECTORG2DX, name "GetObjectOrg2dx"     arg "HANDLE","HANDLE"  ret "FLOAT" out 324
function GetObjectOrg2dx(ctx: VmStateContainer) {
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.positionX : 0);
}
//GETOBJECTORG2DY, name "GetObjectOrg2dy"     arg "HANDLE","HANDLE"  ret "FLOAT" out 325
function GetObjectOrg2dy(ctx: VmStateContainer) {
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.positionY : 0);
}
//GETOBJECTSIZE2DX, name "GetObjectWidth2d"    arg "HANDLE","HANDLE"  ret "FLOAT" out 328
function GetObjectWidth2d(ctx: VmStateContainer) {
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.width : 0);
}
//GETOBJECTSIZE2DY, name "GetObjectHeight2d"    arg "HANDLE","HANDLE"  ret "FLOAT" out 329
function GetObjectHeight2d(ctx: VmStateContainer) {
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.height : 0);
}

//GETOBJECTBYNAME, name "GetObject2dByName"   arg "HANDLE","HANDLE","STRING" ret "HANDLE" out 224
function GetObject2dByName(ctx: VmStateContainer) {
    const objectName = <string>ctx.stackPop();
    const groupHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();

    if (objectName === "") return ctx.stackPush(0);

    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) return ctx.stackPush(0);

    let group: GroupObjectState | undefined;
    if (groupHandle) {
        const maybeGroup = space.getObject(groupHandle);
        // TODO: проверить эту ситуацию (фейковая группа или ее нет)
        if (!maybeGroup || maybeGroup.type !== "otGROUP2D") return ctx.stackPush(0);
        group = maybeGroup;
    }
    const object = space.findObjectByName(objectName, group);
    ctx.stackPush(object ? object.handle : 0);
}

//GETOBJECTFROMPOINT2D, name "GetObjectFromPoint2d"  arg "HANDLE","FLOAT","FLOAT" ret "HANDLE" out 380
function GetObjectFromPoint2d(ctx: VmStateContainer) {
    const y = <number>ctx.stackPop();
    const x = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const obj = space.getObjectFromPoint(x, y);
    ctx.stackPush(obj ? obj.handle : 0);
}

//GETSPACEORGX, name "GetSpaceOrg2dx"        arg "HANDLE" ret "FLOAT" out 342
function GetSpaceOrg2dx(ctx: VmStateContainer) {
    const space = ctx.windows.getSpace(<number>ctx.stackPop());
    ctx.stackPush(space ? space.originX : 0);
}

//GETSPACEORGY, name "GetSpaceOrg2dy"        arg "HANDLE" ret "FLOAT" out 341
function GetSpaceOrg2dy(ctx: VmStateContainer) {
    const space = ctx.windows.getSpace(<number>ctx.stackPop());
    ctx.stackPush(space ? space.originY : 0);
}

//SETSPACEORG2D, name "SetSpaceOrg2d"         arg "HANDLE","FLOAT","FLOAT" ret "FLOAT" out 343
function SetSpaceOrg2d(ctx: VmStateContainer) {
    const y = <number>ctx.stackPop();
    const x = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? space.setOrigin(x, y) : 0);
}
//SETSCALESPACE2D, name "SetScaleSpace2d"       arg "HANDLE","FLOAT" ret "FLOAT" out 344
function SetScaleSpace2d(ctx: VmStateContainer) {
    const scale = <number>ctx.stackPop();
    const hspace = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(hspace);
    ctx.stackPush(space ? 1 : 0);
    // ctx.stackPush(space ? space.setScale(scale) : 0);
}
//GETSCALESPACE2D, name "GetScaleSpace2d"       arg "HANDLE" ret "FLOAT" out 345
function GetScaleSpace2d(ctx: VmStateContainer) {
    const space = ctx.windows.getSpace(<number>ctx.stackPop());
    // ctx.setError("GetScaleSpace2d не реализована");
    // return;
    ctx.stackPush(space ? 1 : 0);
    // ctx.stackPush(space ? space.scale : 0);
}

function GetActualWidth2d(ctx: VmStateContainer) {
    const objectHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.width : 0);
}

function GetActualHeight2d(ctx: VmStateContainer) {
    const objectHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj ? obj.height : 0);
}

function DelGroupItem2d(ctx: VmStateContainer) {
    const objectHandle = ctx.stackPop() as number;
    const groupHandle = ctx.stackPop() as number; //нахрена?
    const spaceHandle = ctx.stackPop() as number;

    const obj = _getObject(ctx, spaceHandle, objectHandle);
    if (obj && obj.parent) {
        obj.parent.removeItem(obj);
        ctx.stackPush(1);
    } else {
        ctx.stackPush(0);
    }
}

function SetControlText2d(ctx: VmStateContainer) {
    const text = ctx.stackPop() as string;
    const objectHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    if (obj && obj.type === "otCONTROL2D") {
        obj.text = text;
        ctx.stackPush(1);
    } else {
        ctx.stackPush(0);
    }
}
function GetControlText2d(ctx: VmStateContainer) {
    const objectHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj && obj.type === "otCONTROL2D" ? obj.text : "");
}

function SetBitmapSrcRect2d(ctx: VmStateContainer) {
    const height = ctx.stackPop() as number;
    const width = ctx.stackPop() as number;
    const y = ctx.stackPop() as number;
    const x = ctx.stackPop() as number;
    const objectHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const obj = _getObject(ctx, spaceHandle, objectHandle);
    ctx.stackPush(obj && obj.type === "otBITMAP2D" ? obj.setRect(x, y, width, height) : 0);
}

function GetVectorPoint2dx(ctx: VmStateContainer) {
    const index = ctx.stackPop() as number;
    const lineHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const obj = _getObject(ctx, spaceHandle, lineHandle);
    ctx.stackPush(obj && obj.type === "otLINE2D" ? obj.getPoint(index).x : 0);
}

function GetVectorPoint2dy(ctx: VmStateContainer) {
    const index = ctx.stackPop() as number;
    const lineHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const obj = _getObject(ctx, spaceHandle, lineHandle);
    ctx.stackPush(obj && obj.type === "otLINE2D" ? obj.getPoint(index).y : 0);
}

function SetVectorPoint2d(ctx: VmStateContainer) {
    const y = ctx.stackPop() as number;
    const x = ctx.stackPop() as number;
    const index = ctx.stackPop() as number;
    const lineHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const obj = _getObject(ctx, spaceHandle, lineHandle);
    ctx.stackPush(obj && obj.type === "otLINE2D" ? obj.setPointPosition(index, x, y) : 0);
}

// FLOAT IsObjectsIntersect2d(HANDLE HSpace, HANDLE obj1, HANDLE obj2, FLOAT flags)
function IsObjectsIntersect2d(ctx: VmStateContainer) {
    const flags = ctx.stackPop() as number;
    const obj2Handle = ctx.stackPop() as number;
    const obj1Handle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;
    const space = ctx.windows.getSpace(spaceHandle);
    if (space) {
        const obj1 = space.getObject(obj1Handle);
        const obj2 = space.getObject(obj2Handle);
        if (obj1 && obj2) {
            ctx.stackPush(space.isIntersect(obj1, obj2));
            return;
        }
    }
    ctx.stackPush(0);
}

// FLOAT SetObjectName2d(HANDLE HSpace, HANDLE HObject, STRING Name)
function SetObjectName2d(ctx: VmStateContainer) {
    const name = ctx.stackPop() as string;
    const objectHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const obj = _getObject(ctx, spaceHandle, objectHandle);
    if (obj) {
        obj.name = name;
        ctx.stackPush(1);
    } else {
        ctx.stackPush(0);
    }
}

// FLOAT ObjectToTop2d(HANDLE HSpace, HANDLE HObject)
function ObjectToTop2d(ctx: VmStateContainer) {
    const objectHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? space.moveObjectToTop(objectHandle) : 0);
}

// FLOAT GetActualSize2d(HANDLE HSpace2d, HANDLE HObject, &FLOAT x, &FLOAT y)
function GetActualSize2d(ctx: VmStateContainer) {
    const isYNew = ctx.stackPop() as number;
    const yId = ctx.stackPop() as number;
    const isXNew = ctx.stackPop() as number;
    const xId = ctx.stackPop() as number;
    const objectHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;
    const obj = _getObject(ctx, spaceHandle, objectHandle);
    if (!obj) {
        ctx.stackPush(0);
        return;
    }

    const x = obj.width;
    const y = obj.height;
    const cl = ctx.currentClass;

    if (isXNew) cl.setNewVarValue(xId, x);
    else cl.setOldVarValue(xId, x);
    if (isYNew) cl.setNewVarValue(yId, y);
    else cl.setOldVarValue(yId, y);

    ctx.stackPush(1);
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
    addOperation(Opcode.V_ISINTERSECT2D, IsObjectsIntersect2d);
    addOperation(Opcode.SETOBJECTNAME2D, SetObjectName2d);
    addOperation(Opcode.OBJECTTOTOP2D, ObjectToTop2d);
    addOperation(Opcode.VM_GETACTUALSIZE, GetActualSize2d);
}
