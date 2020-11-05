import { OpCode } from "../consts";
import { ExecutionContext } from "../executionContext";
import { Operation } from "../types";

// OPENSCHEMEWINDOW, name "OpenSchemeWindow" arg "STRING","STRING","STRING" ret "HANDLE" out 201
function OpenSchemeWindow(ctx: ExecutionContext) {
    const attrib = ctx.popString();
    const classname = ctx.popString();
    const winName = ctx.popString();
    const space = ctx.windows.getSpaceByWinName(winName);
    if (space) {
        ctx.pushLong(space.handle);
        return;
    }
    const vdr = ctx.project.getClassScheme(classname);
    ctx.pushLong(vdr ? ctx.windows.openSchemeWindow(winName, attrib, vdr) : 0);
}

// HANDLE LoadSpaceWindow(STRING WindowName, STRING FileName, STRING Attribute)
function LoadSpaceWindow(ctx: ExecutionContext) {
    const attrib = ctx.popString();
    const filename = ctx.popString();
    const winName = ctx.popString();
    const space = ctx.windows.getSpaceByWinName(winName);
    if (space) {
        ctx.pushLong(space.handle);
        return;
    }

    if (filename !== "") throw Error(`Вызов LoadSpaceWindow с fileName=${filename} не реализован.`);
    ctx.pushLong(ctx.windows.openSchemeWindow(winName, attrib));
}

// ISWINDOWEXIST, name "IsWindowExist"    arg "STRING" ret "FLOAT" out 214
function IsWindowExist(ctx: ExecutionContext) {
    ctx.pushDouble(ctx.windows.hasWindow(ctx.popString()));
}

// CLOSEWINDOW, name "CloseWindow" arg "STRING" ret "FLOAT" out 202
function CloseWindow(ctx: ExecutionContext) {
    const name = ctx.popString();
    ctx.pushDouble(1);
}
// V_GETHSPBYNAME, name "GetWindowSpace"   arg "STRING" ret "HANDLE" out 204
function GetWindowSpace(ctx: ExecutionContext) {
    const space = ctx.windows.getSpaceByWinName(ctx.popString());
    ctx.pushLong(space ? space.handle : 0);
}
// SHOWWINDOW, name "ShowWindow"       arg "STRING","FLOAT" ret "FLOAT" out 208
function ShowWindow(ctx: ExecutionContext) {
    const flag = ctx.popDouble();
    const name = ctx.popString();
    ctx.pushDouble(1);
}
// SETWINDOWORG, name "SetWindowOrg"     arg "STRING","FLOAT","FLOAT" ret "FLOAT" out 210
function SetWindowOrg(ctx: ExecutionContext) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const name = ctx.popString();
    const window = ctx.windows.getWindow(name);
    ctx.pushDouble(window ? window.setOrigin(x, y) : 0);
}
// V_SETCLIENTSIZE, name "SetClientSize"    arg  "STRING","FLOAT","FLOAT" ret "FLOAT" out 205
function SetClientSize(ctx: ExecutionContext) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const name = ctx.popString();
    const window = ctx.windows.getWindow(name);
    ctx.pushDouble(window ? window.setSize(x, y) : 0);
}
// GETCLIENTWIDTH, name "GetClientWidth"   arg  "STRING"  ret "FLOAT" out 225
function GetClientWidth(ctx: ExecutionContext) {
    const window = ctx.windows.getWindow(ctx.popString());
    ctx.pushDouble(window ? window.width : 0);
}
// GETCLIENTHEIGHT, name "GetClientHeight"  arg  "STRING"  ret "FLOAT" out 226
function GetClientHeight(ctx: ExecutionContext) {
    const window = ctx.windows.getWindow(ctx.popString());
    ctx.pushDouble(window ? window.height : 0);
}
// BRINGWINDOWTOTOP, name "BringWindowToTop" arg "STRING" ret "FLOAT" out 215
function BringWindowToTop(ctx: ExecutionContext) {
    const windowName = ctx.popString();
    ctx.pushDouble(1);
}
// WIN_ORGX, name "GetWindowOrgX"    arg "STRING" ret "FLOAT" out 219
function GetWindowOrgX(ctx: ExecutionContext) {
    const window = ctx.windows.getWindow(ctx.popString());
    ctx.pushDouble(window ? window.originX : 0);
}
// WIN_ORGY, name "GetWindowOrgY"    arg "STRING" ret "FLOAT" out 220
function GetWindowOrgY(ctx: ExecutionContext) {
    const window = ctx.windows.getWindow(ctx.popString());
    ctx.pushDouble(window ? window.originY : 0);
}

// VM_SETWINDOWTRANSPARENT, name "SetWindowTransparent" arg "STRING", "FLOAT" ret "FLOAT" out 782
function SetWindowTransparent(ctx: ExecutionContext) {
    const level = ctx.popDouble();
    const windowName = ctx.popString();
    ctx.pushDouble(1);
}

// VM_SETWINDOWTRANSPARENTCOLOR, name "SetWindowTransparentColor" arg "STRING", "COLORREF" ret "FLOAT" out 783
//Функция устанавливает цвет окна, который не будет отображаться в окне, т.е. окно в местах, где находится этот цвет, будет полностью прозрачным.
function SetWindowTransparentColor(ctx: ExecutionContext) {
    const color = ctx.popLong();
    const winName = ctx.popString();
    ctx.pushDouble(1);
}

// VM_SETWINDOWOWNER, name "SetWindowOwner" arg "HANDLE","HANDLE" ret "FLOAT" out 1107
//Функция устанавливает владельца окна (не родителя). Владелец окна будет находиться всегда под окном-потомком. Т.е. HSpace будет всегда поверх HSpaceParent.
function SetWindowOwner(ctx: ExecutionContext) {
    const hOwnerSpace = ctx.popLong();
    const hSpace = ctx.popLong();
    ctx.pushDouble(1);
}

function GetWindowName(ctx: ExecutionContext) {
    ctx.pushString(ctx.windows.getWinNameBySpaceHandle(ctx.popLong()));
}
function GetWindowProp(ctx: ExecutionContext) {
    const prop = ctx.popString().toLowerCase();
    const windowName = ctx.popString();

    const window = ctx.windows.getWindow(windowName);
    let result = "";
    if (window) {
        if (prop === "classname") result = window.classname;
        else if (prop === "filename") result = window.filename;
    }
    ctx.pushString(result);
}

// FLOAT IsWindowVisible(STRING WindowName)
function IsWindowVisible(ctx: ExecutionContext) {
    const winname = ctx.popString();
    ctx.pushDouble(1);
}

export function initWindows(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(OpCode.OPENSCHEMEWINDOW, OpenSchemeWindow);
    addOperation(OpCode.LOADSPACEWINDOW, LoadSpaceWindow);
    addOperation(OpCode.ISWINDOWEXIST, IsWindowExist);
    addOperation(OpCode.CLOSEWINDOW, CloseWindow);
    addOperation(OpCode.V_GETHSPBYNAME, GetWindowSpace);
    addOperation(OpCode.SHOWWINDOW, ShowWindow);
    addOperation(OpCode.SETWINDOWORG, SetWindowOrg);
    addOperation(OpCode.V_SETCLIENTSIZE, SetClientSize);
    addOperation(OpCode.GETCLIENTWIDTH, GetClientWidth);
    addOperation(OpCode.WIN_SIZEX, GetClientWidth);
    addOperation(OpCode.GETCLIENTHEIGHT, GetClientHeight);
    addOperation(OpCode.WIN_SIZEY, GetClientHeight);
    addOperation(OpCode.BRINGWINDOWTOTOP, BringWindowToTop);
    addOperation(OpCode.WIN_ORGX, GetWindowOrgX);
    addOperation(OpCode.WIN_ORGY, GetWindowOrgY);
    addOperation(OpCode.VM_SETWINDOWTRANSPARENT, SetWindowTransparent);
    addOperation(OpCode.VM_SETWINDOWTRANSPARENTCOLOR, SetWindowTransparentColor);
    addOperation(OpCode.VM_SETWINDOWOWNER, SetWindowOwner);
    addOperation(OpCode.V_GETNAMEBYHSP, GetWindowName);
    addOperation(OpCode.VM_GETWINDOWPROP, GetWindowProp);
    addOperation(OpCode.ISWINDOWVISIBLE, IsWindowVisible);
}
