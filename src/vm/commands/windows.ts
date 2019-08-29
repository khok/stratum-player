import { VmCommand } from ".";
import { Opcode, IVirtualMachine } from "..";

// OPENSCHEMEWINDOW, name "OpenSchemeWindow" arg "STRING","STRING","STRING" ret "HANDLE" out 201
function OpenSchemeWindow(vm: IVirtualMachine) {
    const flags = <string>vm.stackPop();
    const classname = <string>vm.stackPop();
    const winName = <string>vm.stackPop();
    const window = vm.windows.getWindow(winName);
    if (window) {
        vm.stackPush(window.spaceHandle);
        return;
    }
    const resolver = vm.project.createSchemeInstance(classname);
    vm.stackPush(resolver ? vm.windows.createSchemeWindow(winName, flags, resolver) : 0);
}

// ISWINDOWEXIST, name "IsWindowExist"    arg "STRING" ret "FLOAT" out 214
function IsWindowExist(ctx: IVirtualMachine) {
    ctx.stackPush(Number(ctx.windows.hasWindow(<string>ctx.stackPop())));
}

// CLOSEWINDOW, name "CloseWindow" arg "STRING" ret "FLOAT" out 202
function CloseWindow(ctx: IVirtualMachine) {
    const name = ctx.stackPop();
    ctx.stackPush(1);
}
// V_GETHSPBYNAME, name "GetWindowSpace"   arg "STRING" ret "HANDLE" out 204
function GetWindowSpace(ctx: IVirtualMachine) {
    const window = ctx.windows.getWindow(<string>ctx.stackPop());
    ctx.stackPush(window ? window.spaceHandle : 0);
}
// SHOWWINDOW, name "ShowWindow"       arg "STRING","FLOAT" ret "FLOAT" out 208
function ShowWindow(ctx: IVirtualMachine) {
    const flag = ctx.stackPop();
    const name = ctx.stackPop();
    ctx.stackPush(1);
}
// SETWINDOWORG, name "SetWindowOrg"     arg "STRING","FLOAT","FLOAT" ret "FLOAT" out 210
function SetWindowOrg(ctx: IVirtualMachine) {
    const y = <number>ctx.stackPop();
    const x = <number>ctx.stackPop();
    const name = <string>ctx.stackPop();
    const window = ctx.windows.getWindow(name);
    ctx.stackPush(window ? Number(window.setTopLeft(x, y)) : 0);
}
// V_SETCLIENTSIZE, name "SetClientSize"    arg  "STRING","FLOAT","FLOAT" ret "FLOAT" out 205
function SetClientSize(ctx: IVirtualMachine) {
    const y = <number>ctx.stackPop();
    const x = <number>ctx.stackPop();
    const name = <string>ctx.stackPop();
    const window = ctx.windows.getWindow(name);
    ctx.stackPush(window ? Number(window.setSize(x, y)) : 0);
}
// GETCLIENTWIDTH, name "GetClientWidth"   arg  "STRING"  ret "FLOAT" out 225
function GetClientWidth(ctx: IVirtualMachine) {
    const window = ctx.windows.getWindow(<string>ctx.stackPop());
    ctx.stackPush(window ? window.size.x : 0);
}
// GETCLIENTHEIGHT, name "GetClientHeight"  arg  "STRING"  ret "FLOAT" out 226
function GetClientHeight(ctx: IVirtualMachine) {
    const window = ctx.windows.getWindow(<string>ctx.stackPop());
    ctx.stackPush(window ? window.size.y : 0);
}
// BRINGWINDOWTOTOP, name "BringWindowToTop" arg "STRING" ret "FLOAT" out 215
function BringWindowToTop(ctx: IVirtualMachine) {
    const windowName = ctx.stackPop();
    ctx.stackPush(1);
}
// WIN_ORGX, name "GetWindowOrgX"    arg "STRING" ret "FLOAT" out 219
function GetWindowOrgX(ctx: IVirtualMachine) {
    const window = ctx.windows.getWindow(<string>ctx.stackPop());
    ctx.stackPush(window ? window.topLeft.x : 0);
}
// WIN_ORGY, name "GetWindowOrgY"    arg "STRING" ret "FLOAT" out 220
function GetWindowOrgY(ctx: IVirtualMachine) {
    const window = ctx.windows.getWindow(<string>ctx.stackPop());
    ctx.stackPush(window ? window.topLeft.y : 0);
}

// VM_GETSCREENWIDTH, name "GetScreenWidth" ret "FLOAT" out 772
function GetScreenWidth(ctx: IVirtualMachine) {
    ctx.stackPush(ctx.windows.screenSize.x);
}
// VM_GETSCREENHEIGHT, name "GetScreenHeight" ret "FLOAT" out 773
function GetScreenHeight(ctx: IVirtualMachine) {
    ctx.stackPush(ctx.windows.screenSize.y);
}
// VM_GETWORKAREAX, name "GetWorkAreaX" ret "FLOAT" out 774
function GetWorkAreaX(ctx: IVirtualMachine) {
    ctx.stackPush(ctx.windows.workAreaTopLeft.x);
}
// VM_GETWORKAREAY, name "GetWorkAreaY" ret "FLOAT" out 775
function GetWorkAreaY(ctx: IVirtualMachine) {
    ctx.stackPush(ctx.windows.workAreaTopLeft.y);
}
// VM_GETWORKAREAWIDTH, name "GetWorkAreaWidth" ret "FLOAT" out 776
function GetWorkAreaWidth(ctx: IVirtualMachine) {
    ctx.stackPush(ctx.windows.workAreaSize.x);
}
// VM_GETWORKAREAHEIGHT, name "GetWorkAreaHeight" ret "FLOAT" out 777
function GetWorkAreaHeight(ctx: IVirtualMachine) {
    ctx.stackPush(ctx.windows.workAreaSize.y);
}
// VM_SETWINDOWTRANSPARENT, name "SetWindowTransparent" arg "STRING", "FLOAT" ret "FLOAT" out 782
function SetWindowTransparent(ctx: IVirtualMachine) {
    const level = ctx.stackPop();
    const windowName = ctx.stackPop();
    ctx.stackPush(1);
}

// VM_SETWINDOWTRANSPARENTCOLOR, name "SetWindowTransparentColor" arg "STRING", "COLORREF" ret "FLOAT" out 783
//Функция устанавливает цвет окна, который не будет отображаться в окне, т.е. окно в местах, где находится этот цвет, будет полностью прозрачным.
function SetWindowTransparentColor(ctx: IVirtualMachine) {
    const color = ctx.stackPop();
    const winName = ctx.stackPop();
    ctx.stackPush(1);
}

// VM_SETWINDOWOWNER, name "SetWindowOwner" arg "HANDLE","HANDLE" ret "FLOAT" out 1107
//Функция устанавливает владельца окна (не родителя). Владелец окна будет находиться всегда под окном-потомком. Т.е. HSpace будет всегда поверх HSpaceParent.
function SetWindowOwner(ctx: IVirtualMachine) {
    const hOwnerSpace = ctx.stackPop();
    const hSpace = ctx.stackPop();
    ctx.stackPush(1);
}

export default function init(addCommand: (opcode: number, command: VmCommand) => void) {
    addCommand(Opcode.OPENSCHEMEWINDOW, OpenSchemeWindow);
    addCommand(Opcode.ISWINDOWEXIST, IsWindowExist);
    addCommand(Opcode.CLOSEWINDOW, CloseWindow);
    addCommand(Opcode.V_GETHSPBYNAME, GetWindowSpace);
    addCommand(Opcode.SHOWWINDOW, ShowWindow);
    addCommand(Opcode.SETWINDOWORG, SetWindowOrg);
    addCommand(Opcode.V_SETCLIENTSIZE, SetClientSize);
    addCommand(Opcode.GETCLIENTWIDTH, GetClientWidth);
    addCommand(Opcode.GETCLIENTHEIGHT, GetClientHeight);
    addCommand(Opcode.BRINGWINDOWTOTOP, BringWindowToTop);
    addCommand(Opcode.WIN_ORGX, GetWindowOrgX);
    addCommand(Opcode.WIN_ORGY, GetWindowOrgY);
    addCommand(Opcode.VM_GETSCREENWIDTH, GetScreenWidth);
    addCommand(Opcode.VM_GETSCREENHEIGHT, GetScreenHeight);
    addCommand(Opcode.VM_GETWORKAREAX, GetWorkAreaX);
    addCommand(Opcode.VM_GETWORKAREAY, GetWorkAreaY);
    addCommand(Opcode.VM_GETWORKAREAWIDTH, GetWorkAreaWidth);
    addCommand(Opcode.VM_GETWORKAREAHEIGHT, GetWorkAreaHeight);
    addCommand(Opcode.VM_SETWINDOWTRANSPARENT, SetWindowTransparent);
    addCommand(Opcode.VM_SETWINDOWTRANSPARENTCOLOR, SetWindowTransparentColor);
    addCommand(Opcode.VM_SETWINDOWOWNER, SetWindowOwner);
}
