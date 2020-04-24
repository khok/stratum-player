import { Operation, VmStateContainer } from "vm-types";
import { Opcode } from "~/helpers/vmConstants";

function _getText(ctx: VmStateContainer, spaceHandle: number, textHandle: number) {
    const space = ctx.graphics.getSpace(spaceHandle);
    return space && space.tools.texts.get(textHandle);
}

function GetTextObject2d(ctx: VmStateContainer) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.graphics.getSpace(spaceHandle);
    if (!space) {
        ctx.pushLong(0);
        return;
    }
    const obj = space.getObject(objectHandle);
    ctx.pushLong(obj && obj.type === "otTEXT2D" ? obj.textTool.handle : 0);
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

    const space = ctx.graphics.getSpace(spaceHandle);
    if (!space) {
        ctx.pushString("");
        return;
    }
    const tool = space.tools.strings.get(stringHandle);
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
    ctx.pushLong(text ? text.getFragment(0).foregroundColor : 0);
}

function GetTextBkColor2d(ctx: VmStateContainer) {
    const textHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.pushLong(text ? text.getFragment(0).backgroundColor : 0);
}

function CreateFont2d(ctx: VmStateContainer) {
    const flags = ctx.popDouble();
    const height = ctx.popDouble();
    const fontName = ctx.popString();
    const spaceHandle = ctx.popLong();

    const space = ctx.graphics.getSpace(spaceHandle);

    const italic = !!(flags & 1);
    const underlined = !!(flags & 2);
    const strikeout = !!(flags & 4);
    const bold = !!(flags & 8);
    ctx.pushLong(space ? space.tools.createFont(fontName, height, bold).handle : 0);
}

function CreateString2d(ctx: VmStateContainer) {
    const value = ctx.popString();
    const spaceHandle = ctx.popLong();

    const space = ctx.graphics.getSpace(spaceHandle);
    ctx.pushLong(space ? space.tools.createString(value).handle : 0);
}

function CreateText2d(ctx: VmStateContainer) {
    const bgColor = ctx.popLong();
    const fgColor = ctx.popLong();
    const stringHandle = ctx.popLong();
    const fontHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const space = ctx.graphics.getSpace(spaceHandle);
    ctx.pushLong(space ? space.tools.createText(fontHandle, stringHandle, fgColor, bgColor).handle : 0);
}

function SetText2d(ctx: VmStateContainer) {
    //HSpace,HText,HFont,HString,~FgColor,~BgColor
    const bgColor = ctx.popLong();
    const fgColor = ctx.popLong();
    const stringHandle = ctx.popLong();
    const fontHandle = ctx.popLong();
    const textHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.graphics.getSpace(spaceHandle);
    if (!space) {
        ctx.pushDouble(0);
        return;
    }
    const textTool = space.tools.texts.get(textHandle);
    if (!textTool) {
        ctx.pushDouble(0);
        return;
    }
    const fontTool = space.tools.fonts.get(fontHandle);
    if (fontTool) textTool.updateFont(fontTool, 0);
    const stringTool = space.tools.strings.get(stringHandle);
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
    const space = ctx.graphics.getSpace(spaceHandle);
    if (!space) {
        ctx.pushDouble(0);
        return;
    }
    const stringTool = space.tools.strings.get(stringHandle);
    ctx.pushDouble(stringTool ? stringTool.setText(text) : 0);
}

function CreatePen2d(ctx: VmStateContainer) {
    const rop2 = ctx.popDouble();
    const color = ctx.popLong();
    const width = ctx.popDouble();
    const style = ctx.popDouble();
    const spaceHandle = ctx.popLong();

    const space = ctx.graphics.getSpace(spaceHandle);
    ctx.pushLong(space ? space.tools.createPen(width, color, style).handle : 0);
}

// FLOAT SetPenROP2d(HANDLE HSpace, HANDLE HPen, FLOAT rop)
function SetPenROP2d(ctx: VmStateContainer) {
    const rop = ctx.popDouble();
    const penHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.graphics.getSpace(spaceHandle);
    if (!space) {
        ctx.pushDouble(0);
        return;
    }
    const pen = space.tools.pens.get(penHandle);
    ctx.pushDouble(pen ? 1 : 0);
}

// HANDLE CreateBrush2d(HANDLE HSpace, FLOAT Style, FLOAT Hatch, COLORREF Color, HANDLE HDib, FLOAT Type)
function CreateBrush2d(ctx: VmStateContainer) {
    const type = ctx.popDouble();
    const dibHandle = ctx.popLong();
    const color = ctx.popLong();
    const hatch = ctx.popDouble();
    const style = ctx.popDouble();
    const spaceHandle = ctx.popLong();

    const space = ctx.graphics.getSpace(spaceHandle);
    ctx.pushLong(space ? space.tools.createBrush(color, style, dibHandle).handle : 0);
}

// FLOAT SetBrushColor2d(HANDLE HSpace, HANDLE HBrush, COLORREF Color)
function SetBrushColor2d(ctx: VmStateContainer) {
    const color = ctx.popLong();
    const brushHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.graphics.getSpace(spaceHandle);
    if (!space) {
        ctx.pushDouble(0);
        return;
    }
    const brush = space.tools.brushes.get(brushHandle);
    ctx.pushDouble(brush ? brush.setColor(color) : 0);
}

// FLOAT SetBrushROP2d(HANDLE HSpace, HANDLE HBrush, FLOAT rop)
function SetBrushROP2d(ctx: VmStateContainer) {
    const rop = ctx.popDouble();
    const brushHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.graphics.getSpace(spaceHandle);
    if (!space) {
        ctx.pushDouble(0);
        return;
    }
    const brush = space.tools.brushes.get(brushHandle);
    ctx.pushDouble(brush ? 1 : 0);
}

// HANDLE CreateDIB2d(HANDLE HSpace, STRING FileName)
function CreateDIB2d(ctx: VmStateContainer) {
    const bmpFilename = ctx.popString();
    const spaceHandle = ctx.popLong();
    const space = ctx.graphics.getSpace(spaceHandle);
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
    addOperation(Opcode.VM_SETLOGTEXT2D, SetText2d);
    addOperation(Opcode.SETLOGSTRING2D, SetString2d);
    addOperation(Opcode.CREATEPEN2D, CreatePen2d);
    addOperation(Opcode.SETPENROP2D, SetPenROP2d);
    addOperation(Opcode.CREATEBRUSH2D, CreateBrush2d);
    addOperation(Opcode.SETBRUSHCOLOR2D, SetBrushColor2d);
    addOperation(Opcode.SETBRUSHROP2D, SetBrushROP2d);
    addOperation(Opcode.CREATEDID2D, CreateDIB2d);
}
