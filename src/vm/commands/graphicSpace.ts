import { VmCommand } from ".";
import { Opcode, IVirtualMachine } from "..";

//GETOBJECTBYNAME, name "GetObject2dByName"   arg "HANDLE","HANDLE","STRING" ret "HANDLE" out 224
function GetObject2dByName(ctx: IVirtualMachine) {
    const objectName = <string>ctx.stackPop();
    const groupHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? space.findObjectHandle(groupHandle, objectName) : 0);
}

//args: "HANDLE,HANDLE,FLOAT ret FLOAT"
function SetShowObject2d(ctx: IVirtualMachine) {
    const visible = <number>ctx.stackPop();
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const obj = space.getObject(objectHandle);
    ctx.stackPush(obj ? Number(obj.setVisible(Boolean(visible))) : 0);
}

// args: "HANDLE,HANDLE  ret HANDLE"
function GetObjectParent2d(ctx: IVirtualMachine) {
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const obj = space.getObject(objectHandle);
    ctx.stackPush(obj ? obj.parentHandle : 0);
}

//args: "HANDLE,HANDLE ret FLOAT "
function GetZOrder2d(ctx: IVirtualMachine) {
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const obj = space.getObject(objectHandle);
    ctx.stackPush(obj ? obj.zOrder : 0);
}

//args: "HANDLE,HANDLE ret FLOAT "
function SetZOrder2d(ctx: IVirtualMachine) {
    const zOrder = <number>ctx.stackPop();
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const obj = space.getObject(objectHandle);
    ctx.stackPush(obj ? Number(obj.setZOrder(zOrder)) : 0);
}

args: "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT  ret FLOAT";
function RotateObject2d(ctx: IVirtualMachine) {
    const angle = <number>ctx.stackPop();
    const centerY = <number>ctx.stackPop();
    const centerX = <number>ctx.stackPop();
    const objectHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const obj = space.getObject(objectHandle);
    ctx.stackPush(obj ? Number(obj.rotate(centerX, centerY, angle)) : 0);
}

//SETOBJECTORG2D, name "SetObjectOrg2d"      arg "HANDLE","HANDLE","FLOAT","FLOAT"  ret "FLOAT" out 331
function SetObjectOrg2d(ctx: IVirtualMachine) {
    const y = <number>ctx.stackPop();
    const x = <number>ctx.stackPop();
    const objHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const obj = space.getObject(objHandle);
    ctx.stackPush(obj ? Number(obj.setPosition(x, y)) : 0);
}

//"HANDLE,HANDLE,FLOAT,FLOAT  ret FLOAT"
function SetObjectSize2d(ctx: IVirtualMachine) {
    const height = <number>ctx.stackPop();
    const width = <number>ctx.stackPop();
    const objHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const obj = space.getObject(objHandle);
    ctx.stackPush(obj ? Number(obj.setSize(width, height)) : 0);
}

//GETOBJECTFROMPOINT2D, name "GetObjectFromPoint2d"  arg "HANDLE","FLOAT","FLOAT" ret "HANDLE" out 380
function GetObjectFromPoint2d(ctx: IVirtualMachine) {
    const y = <number>ctx.stackPop();
    const x = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? space.getObjectHandleFromPoint(x, y) : 0);
}

//GETOBJECTORG2DX, name "GetObjectOrg2dx"     arg "HANDLE","HANDLE"  ret "FLOAT" out 324
function GetObjectOrg2dx(ctx: IVirtualMachine) {
    const objHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const obj = space.getObject(objHandle);
    ctx.stackPush(obj ? obj.left : 0);
}
//GETOBJECTORG2DY, name "GetObjectOrg2dy"     arg "HANDLE","HANDLE"  ret "FLOAT" out 325
function GetObjectOrg2dy(ctx: IVirtualMachine) {
    const objHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const obj = space.getObject(objHandle);
    ctx.stackPush(obj ? obj.top : 0);
}
//GETOBJECTSIZE2DX, name "GetObjectWidth2d"    arg "HANDLE","HANDLE"  ret "FLOAT" out 328
function GetObjectWidth2d(ctx: IVirtualMachine) {
    const objHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const obj = space.getObject(objHandle);
    ctx.stackPush(obj ? obj.width : 0);
}
//GETOBJECTSIZE2DY, name "GetObjectHeight2d"    arg "HANDLE","HANDLE"  ret "FLOAT" out 329
function GetObjectHeight2d(ctx: IVirtualMachine) {
    const objHandle = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const obj = space.getObject(objHandle);
    ctx.stackPush(obj ? obj.height : 0);
}

//GETSPACEORGY, name "GetSpaceOrg2dy"        arg "HANDLE" ret "FLOAT" out 341
function GetSpaceOrg2dy(ctx: IVirtualMachine) {
    const space = ctx.windows.getSpace(<number>ctx.stackPop());
    ctx.stackPush(space ? space.topLeft.y : 0);
}
//GETSPACEORGX, name "GetSpaceOrg2dx"        arg "HANDLE" ret "FLOAT" out 342
function GetSpaceOrg2dx(ctx: IVirtualMachine) {
    const space = ctx.windows.getSpace(<number>ctx.stackPop());
    ctx.stackPush(space ? space.topLeft.x : 0);
}
//SETSPACEORG2D, name "SetSpaceOrg2d"         arg "HANDLE","FLOAT","FLOAT" ret "FLOAT" out 343
function SetSpaceOrg2d(ctx: IVirtualMachine) {
    const y = <number>ctx.stackPop();
    const x = <number>ctx.stackPop();
    const spaceHandle = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? Number(space.setTopLeft(x, y)) : 0);
}
//SETSCALESPACE2D, name "SetScaleSpace2d"       arg "HANDLE","FLOAT" ret "FLOAT" out 344
function SetScaleSpace2d(ctx: IVirtualMachine) {
    const scale = <number>ctx.stackPop();
    const hspace = <number>ctx.stackPop();
    const space = ctx.windows.getSpace(hspace);
    ctx.stackPush(space ? Number(space.setScale(scale)) : 0);
}
//GETSCALESPACE2D, name "GetScaleSpace2d"       arg "HANDLE" ret "FLOAT" out 345
function GetScaleSpace2d(ctx: IVirtualMachine) {
    const space = ctx.windows.getSpace(<number>ctx.stackPop());
    ctx.stackPush(space ? space.scale : 0);
}

export default function init(addCommand: (opcode: number, command: VmCommand) => void) {
    addCommand(Opcode.GETOBJECTBYNAME, GetObject2dByName);
    addCommand(Opcode.SETOBJECTORG2D, SetObjectOrg2d);
    addCommand(Opcode.GETOBJECTFROMPOINT2D, GetObjectFromPoint2d);
    addCommand(Opcode.GETOBJECTORG2DX, GetObjectOrg2dx);
    addCommand(Opcode.GETOBJECTORG2DY, GetObjectOrg2dy);
    addCommand(Opcode.GETOBJECTSIZE2DX, GetObjectWidth2d);
    addCommand(Opcode.GETOBJECTSIZE2DY, GetObjectHeight2d);
    addCommand(Opcode.GETSPACEORGY, GetSpaceOrg2dy);
    addCommand(Opcode.GETSPACEORGX, GetSpaceOrg2dx);
    addCommand(Opcode.SETSPACEORG2D, SetSpaceOrg2d);
    addCommand(Opcode.SETSCALESPACE2D, SetScaleSpace2d);
    addCommand(Opcode.GETSCALESPACE2D, GetScaleSpace2d);

    addCommand(Opcode.GETOBJECTPARENT2D, GetObjectParent2d);
    addCommand(Opcode.ROTATEOBJECT2D, RotateObject2d);
    addCommand(Opcode.SETOBJECTSIZE2D, SetObjectSize2d);
    addCommand(Opcode.SETSHOWOBJECT2D, SetShowObject2d);
    addCommand(Opcode.SETZORDER2D, SetZOrder2d);
    addCommand(Opcode.GETZORDER2D, GetZOrder2d);
}
