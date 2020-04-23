import { Operation, VmStateContainer } from "vm-types";
import { Opcode } from "~/helpers/vmConstants";

// OPENSCHEMEWINDOW, name "OpenSchemeWindow" arg "STRING","STRING","STRING" ret "HANDLE" out 201
function OpenSchemeWindow(ctx: VmStateContainer) {
    const attrib = ctx.popString();
    const classname = ctx.popString();
    const winName = ctx.popString();
    const window = ctx.graphics.getWindow(winName);
    if (window) {
        ctx.pushLong(window.space.handle);
        return;
    }
    const vdr = ctx.project.getClassScheme(classname);
    ctx.pushLong(vdr ? ctx.graphics.createSchemeWindow(winName, attrib, vdr, classname) : 0);
}

// HANDLE LoadSpaceWindow(STRING WindowName, STRING FileName, STRING Attribute)
function LoadSpaceWindow(ctx: VmStateContainer) {
    const attrib = ctx.popString();
    const fileName = ctx.popString();
    const winName = ctx.popString();
    const window = ctx.graphics.getWindow(winName);
    if (window) {
        ctx.pushLong(window.space.handle);
        return;
    }

    if (fileName !== "") {
        ctx.setError(`Вызов LoadSpaceWindow с fileName=${fileName} не реализован.`);
        return;
    }

    ctx.pushLong(ctx.graphics.createSchemeWindow(winName, attrib));
}

// ISWINDOWEXIST, name "IsWindowExist"    arg "STRING" ret "FLOAT" out 214
function IsWindowExist(ctx: VmStateContainer) {
    ctx.pushDouble(ctx.graphics.hasWindow(ctx.popString()));
}

// CLOSEWINDOW, name "CloseWindow" arg "STRING" ret "FLOAT" out 202
function CloseWindow(ctx: VmStateContainer) {
    const name = ctx.popString();
    ctx.pushDouble(1);
}
// V_GETHSPBYNAME, name "GetWindowSpace"   arg "STRING" ret "HANDLE" out 204
function GetWindowSpace(ctx: VmStateContainer) {
    const window = ctx.graphics.getWindow(ctx.popString());
    ctx.pushLong(window ? window.space.handle : 0);
}
// SHOWWINDOW, name "ShowWindow"       arg "STRING","FLOAT" ret "FLOAT" out 208
function ShowWindow(ctx: VmStateContainer) {
    const flag = ctx.popDouble();
    const name = ctx.popString();
    ctx.pushDouble(1);
}
// SETWINDOWORG, name "SetWindowOrg"     arg "STRING","FLOAT","FLOAT" ret "FLOAT" out 210
function SetWindowOrg(ctx: VmStateContainer) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const name = ctx.popString();
    const window = ctx.graphics.getWindow(name);
    ctx.pushDouble(window ? window.setOrigin(x, y) : 0);
}
// V_SETCLIENTSIZE, name "SetClientSize"    arg  "STRING","FLOAT","FLOAT" ret "FLOAT" out 205
function SetClientSize(ctx: VmStateContainer) {
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const name = ctx.popString();
    const window = ctx.graphics.getWindow(name);
    ctx.pushDouble(window ? window.setSize(x, y) : 0);
}
// GETCLIENTWIDTH, name "GetClientWidth"   arg  "STRING"  ret "FLOAT" out 225
function GetClientWidth(ctx: VmStateContainer) {
    const window = ctx.graphics.getWindow(ctx.popString());
    ctx.pushDouble(window ? window.width : 0);
}
// GETCLIENTHEIGHT, name "GetClientHeight"  arg  "STRING"  ret "FLOAT" out 226
function GetClientHeight(ctx: VmStateContainer) {
    const window = ctx.graphics.getWindow(ctx.popString());
    ctx.pushDouble(window ? window.height : 0);
}
// BRINGWINDOWTOTOP, name "BringWindowToTop" arg "STRING" ret "FLOAT" out 215
function BringWindowToTop(ctx: VmStateContainer) {
    const windowName = ctx.popString();
    ctx.pushDouble(1);
}
// WIN_ORGX, name "GetWindowOrgX"    arg "STRING" ret "FLOAT" out 219
function GetWindowOrgX(ctx: VmStateContainer) {
    const window = ctx.graphics.getWindow(ctx.popString());
    ctx.pushDouble(window ? window.originX : 0);
}
// WIN_ORGY, name "GetWindowOrgY"    arg "STRING" ret "FLOAT" out 220
function GetWindowOrgY(ctx: VmStateContainer) {
    const window = ctx.graphics.getWindow(ctx.popString());
    ctx.pushDouble(window ? window.originY : 0);
}

// VM_SETWINDOWTRANSPARENT, name "SetWindowTransparent" arg "STRING", "FLOAT" ret "FLOAT" out 782
function SetWindowTransparent(ctx: VmStateContainer) {
    const level = ctx.popDouble();
    const windowName = ctx.popString();
    ctx.pushDouble(1);
}

// VM_SETWINDOWTRANSPARENTCOLOR, name "SetWindowTransparentColor" arg "STRING", "COLORREF" ret "FLOAT" out 783
//Функция устанавливает цвет окна, который не будет отображаться в окне, т.е. окно в местах, где находится этот цвет, будет полностью прозрачным.
function SetWindowTransparentColor(ctx: VmStateContainer) {
    const color = ctx.popLong();
    const winName = ctx.popString();
    ctx.pushDouble(1);
}

// VM_SETWINDOWOWNER, name "SetWindowOwner" arg "HANDLE","HANDLE" ret "FLOAT" out 1107
//Функция устанавливает владельца окна (не родителя). Владелец окна будет находиться всегда под окном-потомком. Т.е. HSpace будет всегда поверх HSpaceParent.
function SetWindowOwner(ctx: VmStateContainer) {
    const hOwnerSpace = ctx.popLong();
    const hSpace = ctx.popLong();
    ctx.pushDouble(1);
}

function GetWindowName(ctx: VmStateContainer) {
    const spaceHandle = ctx.popLong();
    ctx.pushString(ctx.graphics.getWindowBySpaceHandle(spaceHandle) || "");
}
function GetWindowProp(ctx: VmStateContainer) {
    const prop = ctx.popString().toLowerCase();
    const windowName = ctx.popString();

    const window = ctx.graphics.getWindow(windowName);
    ctx.pushString(window && (prop === "classname" || prop === "filename") ? window.getProp(prop) : "");
}

export function initWindows(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(Opcode.OPENSCHEMEWINDOW, OpenSchemeWindow);
    addOperation(Opcode.LOADSPACEWINDOW, LoadSpaceWindow);
    addOperation(Opcode.ISWINDOWEXIST, IsWindowExist);
    addOperation(Opcode.CLOSEWINDOW, CloseWindow);
    addOperation(Opcode.V_GETHSPBYNAME, GetWindowSpace);
    addOperation(Opcode.SHOWWINDOW, ShowWindow);
    addOperation(Opcode.SETWINDOWORG, SetWindowOrg);
    addOperation(Opcode.V_SETCLIENTSIZE, SetClientSize);
    addOperation(Opcode.GETCLIENTWIDTH, GetClientWidth);
    addOperation(Opcode.GETCLIENTHEIGHT, GetClientHeight);
    addOperation(Opcode.BRINGWINDOWTOTOP, BringWindowToTop);
    addOperation(Opcode.WIN_ORGX, GetWindowOrgX);
    addOperation(Opcode.WIN_ORGY, GetWindowOrgY);
    addOperation(Opcode.VM_SETWINDOWTRANSPARENT, SetWindowTransparent);
    addOperation(Opcode.VM_SETWINDOWTRANSPARENTCOLOR, SetWindowTransparentColor);
    addOperation(Opcode.VM_SETWINDOWOWNER, SetWindowOwner);
    addOperation(Opcode.V_GETNAMEBYHSP, GetWindowName);
    addOperation(Opcode.VM_GETWINDOWPROP, GetWindowProp);
}
