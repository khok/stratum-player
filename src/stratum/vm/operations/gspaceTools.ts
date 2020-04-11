import { Operation, VmStateContainer } from "vm-types";
import { Opcode } from "~/helpers/vmConstants";
import { StringToolState, FontToolState, TextToolState } from "vm-interfaces-graphics";
import { colorrefToString, stringToColorref } from "~/helpers/varValueFunctions";

function _getText(ctx: VmStateContainer, spaceHandle: number, textHandle: number) {
    const space = ctx.windows.getSpace(spaceHandle);
    return space && (space.tools.getTool("ttTEXT2D", textHandle) as TextToolState);
}

function GetTextObject2d(ctx: VmStateContainer) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.pushLong(0);
        return;
    }
    const obj = space.getObject(objectHandle);
    if (!obj || obj.type !== "otTEXT2D") {
        ctx.pushLong(0);
        return;
    }
    ctx.pushLong(obj.textTool.handle);
}

function GetTextCount2d(ctx: VmStateContainer) {
    const textHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.pushDouble(text ? text.textCount : 0);
}

function GetTextString2d(ctx: VmStateContainer) {
    const textHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.pushLong(text ? text.getFragment(0).stringFragment.handle : 0);
}

function GetString2d(ctx: VmStateContainer) {
    const stringHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.pushString("");
        return;
    }
    const tool = space.tools.getTool("ttSTRING2D", stringHandle) as StringToolState;
    if (!tool) {
        ctx.pushString("");
        return;
    }
    ctx.pushString(tool ? tool.text : "");
}

function GetTextFont2d(ctx: VmStateContainer) {
    const textHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.pushLong(text ? text.getFragment(0).font.handle : 0);
}

function GetTextFgColor2d(ctx: VmStateContainer) {
    const textHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.pushLong(text ? stringToColorref(text.getFragment(0).foregroundColor) : 0);
}

function GetTextBkColor2d(ctx: VmStateContainer) {
    const textHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.pushLong(text ? stringToColorref(text.getFragment(0).backgroundColor) : 0);
}

function CreateFont2d(ctx: VmStateContainer) {
    const flags = ctx.popDouble();
    const height = ctx.popDouble();
    const fontName = ctx.popString();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);

    const italic = !!(flags & 1);
    const underlined = !!(flags & 2);
    const strikeout = !!(flags & 4);
    const bold = !!(flags & 8);
    ctx.pushLong(space ? space.tools.createFont(fontName, height, bold).handle : 0);
}

function CreateString2d(ctx: VmStateContainer) {
    const value = ctx.popString();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    ctx.pushLong(space ? space.tools.createString(value).handle : 0);
}

function CreateText2d(ctx: VmStateContainer) {
    const bgColor = colorrefToString(ctx.popLong());
    const fgColor = colorrefToString(ctx.popLong());
    const stringHandle = ctx.popLong();
    const fontHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.pushLong(0);
        return;
    }
    const font = space.tools.getTool("ttFONT2D", fontHandle) as FontToolState;
    const stringTool = space.tools.getTool("ttSTRING2D", stringHandle) as StringToolState;
    if (!font || !stringTool) {
        ctx.pushLong(0);
        return;
    }
    ctx.pushLong(space ? space.tools.createText(font, stringTool, fgColor, bgColor).handle : 0);
}

function CreateRasterText2d(ctx: VmStateContainer) {
    const angle = ctx.popDouble();
    const y = ctx.popDouble();
    const x = ctx.popDouble();
    const textHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const space = ctx.windows.getSpace(spaceHandle);
    ctx.pushLong(space ? space.createText(x, y, angle, textHandle).handle : 0);
}
function SetText2d(ctx: VmStateContainer) {
    //HSpace,HText,HFont,HString,~FgColor,~BgColor
    const bgColor = colorrefToString(ctx.popLong());
    const fgColor = colorrefToString(ctx.popLong());
    const stringHandle = ctx.popLong();
    const fontHandle = ctx.popLong();
    const textHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.pushDouble(0);
        return;
    }
    const textTool = space.tools.getTool("ttTEXT2D", textHandle) as TextToolState;
    if (!textTool) {
        ctx.pushDouble(0);
        return;
    }
    const fontTool = space.tools.getTool("ttFONT2D", fontHandle) as FontToolState;
    if (fontTool) textTool.updateFont(fontTool, 0);
    const stringTool = space.tools.getTool("ttSTRING2D", stringHandle) as StringToolState;
    if (stringTool) textTool.updateString(stringTool, 0);
    textTool.updateFgColor(fgColor, 0);
    textTool.updateBgColor(bgColor, 0);
    ctx.pushDouble(1);
}
function SetString2d(ctx: VmStateContainer) {
    //~HSpace,~HString,~text
    const text = ctx.popString();
    const stringHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.pushDouble(0);
        return;
    }
    const stringTool = space.tools.getTool("ttSTRING2D", stringHandle) as StringToolState;
    if (!stringTool) {
        ctx.pushDouble(0);
        return;
    }
    stringTool.text = text;
    ctx.pushDouble(1);
}

function CreatePen2d(ctx: VmStateContainer) {
    const rop2 = ctx.popDouble();
    const color = colorrefToString(ctx.popLong());
    const width = ctx.popDouble();
    const style = ctx.popDouble();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    ctx.pushLong(space ? space.tools.createPen(width, color).handle : 0);
}

// HANDLE CreateDIB2d(HANDLE HSpace, STRING FileName)
function CreateDIB2d(ctx: VmStateContainer) {
    const bmpFilename = ctx.popString();
    const spaceHandle = ctx.popLong();
    const space = ctx.windows.getSpace(spaceHandle);
    ctx.pushLong(space ? space.tools.createBitmap(bmpFilename).handle : 0);
}

export function initGraphicTools(addOperation: (opcode: number, operation: Operation) => void) {
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
    addOperation(Opcode.CREATEDID2D, CreateDIB2d);
}
