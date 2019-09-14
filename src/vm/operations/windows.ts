import { Opcode } from "../opcode";
import { Operation, VmContext } from "../types";

// OPENSCHEMEWINDOW, name "OpenSchemeWindow" arg "STRING","STRING","STRING" ret "HANDLE" out 201
function OpenSchemeWindow(ctx: VmContext) {
    const flags = <string>ctx.stackPop();
    const classname = <string>ctx.stackPop();
    const winName = <string>ctx.stackPop();
    const window = ctx.windows.getWindow(winName);
    if (window) {
        ctx.stackPush(window.spaceHandle);
        return;
    }
    const resolver = ctx.project.createSchemeInstance(classname);
    ctx.stackPush(resolver ? ctx.windows.createSchemeWindow(winName, flags, resolver) : 0);
}

// ISWINDOWEXIST, name "IsWindowExist"    arg "STRING" ret "FLOAT" out 214
function IsWindowExist(ctx: VmContext) {
    ctx.stackPush(ctx.windows.hasWindow(<string>ctx.stackPop()));
}

// CLOSEWINDOW, name "CloseWindow" arg "STRING" ret "FLOAT" out 202
function CloseWindow(ctx: VmContext) {
    const name = ctx.stackPop();
    ctx.stackPush(1);
}
// V_GETHSPBYNAME, name "GetWindowSpace"   arg "STRING" ret "HANDLE" out 204
function GetWindowSpace(ctx: VmContext) {
    const window = ctx.windows.getWindow(<string>ctx.stackPop());
    ctx.stackPush(window ? window.spaceHandle : 0);
}
// SHOWWINDOW, name "ShowWindow"       arg "STRING","FLOAT" ret "FLOAT" out 208
function ShowWindow(ctx: VmContext) {
    const flag = ctx.stackPop();
    const name = ctx.stackPop();
    ctx.stackPush(1);
}
// SETWINDOWORG, name "SetWindowOrg"     arg "STRING","FLOAT","FLOAT" ret "FLOAT" out 210
function SetWindowOrg(ctx: VmContext) {
    const y = <number>ctx.stackPop();
    const x = <number>ctx.stackPop();
    const name = <string>ctx.stackPop();
    const window = ctx.windows.getWindow(name);
    ctx.stackPush(window ? window.setOrigin(x, y) : 0);
}
// V_SETCLIENTSIZE, name "SetClientSize"    arg  "STRING","FLOAT","FLOAT" ret "FLOAT" out 205
function SetClientSize(ctx: VmContext) {
    const y = <number>ctx.stackPop();
    const x = <number>ctx.stackPop();
    const name = <string>ctx.stackPop();
    const window = ctx.windows.getWindow(name);
    ctx.stackPush(window ? window.setSize(x, y) : 0);
}
// GETCLIENTWIDTH, name "GetClientWidth"   arg  "STRING"  ret "FLOAT" out 225
function GetClientWidth(ctx: VmContext) {
    const window = ctx.windows.getWindow(<string>ctx.stackPop());
    ctx.stackPush(window ? window.width : 0);
}
// GETCLIENTHEIGHT, name "GetClientHeight"  arg  "STRING"  ret "FLOAT" out 226
function GetClientHeight(ctx: VmContext) {
    const window = ctx.windows.getWindow(<string>ctx.stackPop());
    ctx.stackPush(window ? window.height : 0);
}
// BRINGWINDOWTOTOP, name "BringWindowToTop" arg "STRING" ret "FLOAT" out 215
function BringWindowToTop(ctx: VmContext) {
    const windowName = ctx.stackPop();
    ctx.stackPush(1);
}
// WIN_ORGX, name "GetWindowOrgX"    arg "STRING" ret "FLOAT" out 219
function GetWindowOrgX(ctx: VmContext) {
    const window = ctx.windows.getWindow(<string>ctx.stackPop());
    ctx.stackPush(window ? window.originX : 0);
}
// WIN_ORGY, name "GetWindowOrgY"    arg "STRING" ret "FLOAT" out 220
function GetWindowOrgY(ctx: VmContext) {
    const window = ctx.windows.getWindow(<string>ctx.stackPop());
    ctx.stackPush(window ? window.originY : 0);
}

// VM_GETSCREENWIDTH, name "GetScreenWidth" ret "FLOAT" out 772
function GetScreenWidth(ctx: VmContext) {
    ctx.stackPush(ctx.windows.screenWidth);
}
// VM_GETSCREENHEIGHT, name "GetScreenHeight" ret "FLOAT" out 773
function GetScreenHeight(ctx: VmContext) {
    ctx.stackPush(ctx.windows.screenHeight);
}
// VM_GETWORKAREAX, name "GetWorkAreaX" ret "FLOAT" out 774
function GetWorkAreaX(ctx: VmContext) {
    ctx.stackPush(ctx.windows.areaOriginX);
}
// VM_GETWORKAREAY, name "GetWorkAreaY" ret "FLOAT" out 775
function GetWorkAreaY(ctx: VmContext) {
    ctx.stackPush(ctx.windows.areaOriginY);
}
// VM_GETWORKAREAWIDTH, name "GetWorkAreaWidth" ret "FLOAT" out 776
function GetWorkAreaWidth(ctx: VmContext) {
    ctx.stackPush(ctx.windows.areaWidth);
}
// VM_GETWORKAREAHEIGHT, name "GetWorkAreaHeight" ret "FLOAT" out 777
function GetWorkAreaHeight(ctx: VmContext) {
    ctx.stackPush(ctx.windows.areaHeight);
}
// VM_SETWINDOWTRANSPARENT, name "SetWindowTransparent" arg "STRING", "FLOAT" ret "FLOAT" out 782
function SetWindowTransparent(ctx: VmContext) {
    const level = ctx.stackPop();
    const windowName = ctx.stackPop();
    ctx.stackPush(1);
}

// VM_SETWINDOWTRANSPARENTCOLOR, name "SetWindowTransparentColor" arg "STRING", "COLORREF" ret "FLOAT" out 783
//Функция устанавливает цвет окна, который не будет отображаться в окне, т.е. окно в местах, где находится этот цвет, будет полностью прозрачным.
function SetWindowTransparentColor(ctx: VmContext) {
    const color = ctx.stackPop();
    const winName = ctx.stackPop();
    ctx.stackPush(1);
}

// VM_SETWINDOWOWNER, name "SetWindowOwner" arg "HANDLE","HANDLE" ret "FLOAT" out 1107
//Функция устанавливает владельца окна (не родителя). Владелец окна будет находиться всегда под окном-потомком. Т.е. HSpace будет всегда поверх HSpaceParent.
function SetWindowOwner(ctx: VmContext) {
    const hOwnerSpace = ctx.stackPop();
    const hSpace = ctx.stackPop();
    ctx.stackPush(1);
}

export function initWindows(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(Opcode.OPENSCHEMEWINDOW, OpenSchemeWindow);
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
    addOperation(Opcode.VM_GETSCREENWIDTH, GetScreenWidth);
    addOperation(Opcode.VM_GETSCREENHEIGHT, GetScreenHeight);
    addOperation(Opcode.VM_GETWORKAREAX, GetWorkAreaX);
    addOperation(Opcode.VM_GETWORKAREAY, GetWorkAreaY);
    addOperation(Opcode.VM_GETWORKAREAWIDTH, GetWorkAreaWidth);
    addOperation(Opcode.VM_GETWORKAREAHEIGHT, GetWorkAreaHeight);
    addOperation(Opcode.VM_SETWINDOWTRANSPARENT, SetWindowTransparent);
    addOperation(Opcode.VM_SETWINDOWTRANSPARENTCOLOR, SetWindowTransparentColor);
    addOperation(Opcode.VM_SETWINDOWOWNER, SetWindowOwner);
}
