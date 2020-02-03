import { Operation, VmStateContainer } from "vm-types";
import { Opcode } from "~/helpers/vmConstants";
import { StringToolState, FontToolState, TextToolState } from "vm-interfaces-graphics";

function _getText(ctx: VmStateContainer, spaceHandle: number, textHandle: number) {
    const space = ctx.windows.getSpace(spaceHandle);
    return space && space.tools.getTool<TextToolState>("ttTEXT2D", textHandle);
}

function GetTextObject2d(ctx: VmStateContainer) {
    const objectHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const obj = space.getObject(objectHandle);
    if (!obj || obj.type !== "otTEXT2D") {
        ctx.stackPush(0);
        return;
    }
    ctx.stackPush(obj.text.handle);
}

function GetTextCount2d(ctx: VmStateContainer) {
    const textHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.stackPush(text ? text.textCount : 0);
}

function GetTextString2d(ctx: VmStateContainer) {
    const textHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.stackPush(text ? text.getFragment(0).stringFragment.handle : 0);
}

function GetString2d(ctx: VmStateContainer) {
    const stringHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const tool = space.tools.getTool<StringToolState>("ttSTRING2D", stringHandle);
    if (!tool) {
        ctx.stackPush(0);
        return;
    }
    ctx.stackPush(tool ? tool.text : "");
}

function GetTextFont2d(ctx: VmStateContainer) {
    const textHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.stackPush(text ? text.getFragment(0).font.handle : 0);
}

function GetTextFgColor2d(ctx: VmStateContainer) {
    const textHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.stackPush(text ? text.getFragment(0).foregroundColor : "");
}

function GetTextBkColor2d(ctx: VmStateContainer) {
    const textHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.stackPush(text ? text.getFragment(0).backgroundColor : "");
}

function CreateFont2d(ctx: VmStateContainer) {
    const flags = ctx.stackPop() as number;
    const height = ctx.stackPop() as number;
    const fontName = ctx.stackPop() as string;
    const spaceHandle = ctx.stackPop() as number;

    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? space.tools.createFont(fontName, height, flags).handle : 0);
}

function CreateString2d(ctx: VmStateContainer) {
    const value = ctx.stackPop() as string;
    const spaceHandle = ctx.stackPop() as number;

    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? space.tools.createString(value).handle : 0);
}

function CreateText2d(ctx: VmStateContainer) {
    const bgColor = ctx.stackPop() as string;
    const fgColor = ctx.stackPop() as string;
    const stringHandle = ctx.stackPop() as number;
    const fontHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const font = space.tools.getTool<FontToolState>("ttFONT2D", fontHandle);
    const stringTool = space.tools.getTool<StringToolState>("ttSTRING2D", stringHandle);
    if (!font || !stringTool) {
        ctx.stackPush(0);
        return;
    }
    ctx.stackPush(space ? space.tools.createText(font, stringTool, fgColor, bgColor).handle : 0);
}

function CreateRasterText2d(ctx: VmStateContainer) {
    const angle = ctx.stackPop() as number;
    const y = ctx.stackPop() as number;
    const x = ctx.stackPop() as number;
    const textHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;
    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? space.createText(x, y, angle, textHandle).handle : 0);
}
function SetText2d(ctx: VmStateContainer) {
    //HSpace,HText,HFont,HString,~FgColor,~BgColor
    const bgColor = ctx.stackPop() as string;
    const fgColor = ctx.stackPop() as string;
    const stringHandle = ctx.stackPop() as number;
    const fontHandle = ctx.stackPop() as number;
    const textHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const textTool = space.tools.getTool<TextToolState>("ttTEXT2D", textHandle);
    if (!textTool) {
        ctx.stackPush(0);
        return;
    }
    const fontTool = space.tools.getTool<FontToolState>("ttFONT2D", fontHandle);
    if (fontTool) textTool.updateFont(fontTool, 0);
    const stringTool = space.tools.getTool<StringToolState>("ttSTRING2D", stringHandle);
    if (stringTool) textTool.updateString(stringTool, 0);
    textTool.updateFgColor(fgColor, 0);
    textTool.updateBgColor(bgColor, 0);
    ctx.stackPush(1);
}
function SetString2d(ctx: VmStateContainer) {
    //~HSpace,~HString,~text
    const text = ctx.stackPop() as string;
    const stringHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.stackPush(0);
        return;
    }
    const stringTool = space.tools.getTool<StringToolState>("ttSTRING2D", stringHandle);
    if (!stringTool) {
        ctx.stackPush(0);
        return;
    }
    stringTool.text = text;
    ctx.stackPush(1);
}

function CreatePen2d(ctx: VmStateContainer) {
    const rop2 = ctx.stackPop() as number;
    const color = ctx.stackPop() as string;
    const width = ctx.stackPop() as number;
    const style = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? space.tools.createPen(width, color).handle : 0);
}

function CreatePolyLine2d(ctx: VmStateContainer, pointCount: number) {
    const points = new Array(pointCount / 2);
    for (let i = pointCount / 2 - 1; i >= 0; i--)
        points[i] = { y: ctx.stackPop() as number, x: ctx.stackPop() as number };
    const brushHandle = ctx.stackPop() as number;
    const penHandle = ctx.stackPop() as number;
    const spaceHandle = ctx.stackPop() as number;

    const space = ctx.windows.getSpace(spaceHandle);
    ctx.stackPush(space ? space.createLine(penHandle, brushHandle, points).handle : 0);
}

export function initTools(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(Opcode.GETTEXTOBJECT2D, GetTextObject2d);
    addOperation(Opcode.VM_GETTEXTCOUNT2D, GetTextCount2d);
    addOperation(Opcode.GETTEXTSTRING2D, GetTextString2d);
    addOperation(Opcode.GETLOGSTRING2D, GetString2d);
    addOperation(Opcode.GETTEXTFONT2D, GetTextFont2d);
    addOperation(Opcode.GETTEXTFG2D, GetTextFgColor2d);
    addOperation(Opcode.GETTEXTBK2D, GetTextBkColor2d);
    addOperation(Opcode.CREATEFONT2D, CreateFont2d);
    addOperation(Opcode.CREATESTRING2D, CreateString2d);
    addOperation(Opcode.CREATETEXT2D, CreateText2d);
    addOperation(Opcode.CREATERASTERTEXT2D, CreateRasterText2d);
    addOperation(Opcode.VM_SETLOGTEXT2D, SetText2d);
    addOperation(Opcode.SETLOGSTRING2D, SetString2d);
    addOperation(Opcode.CREATEPEN2D, CreatePen2d);
    addOperation(Opcode.CREATEPOLYLINE2D, CreatePolyLine2d as Operation);
}
