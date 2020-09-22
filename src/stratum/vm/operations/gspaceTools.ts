import { OpCode } from "../consts";
import { ExecutionContext } from "../executionContext";
import { Operation } from "../types";

function _getText(ctx: ExecutionContext, spaceHandle: number, textHandle: number) {
    const space = ctx.windows.getSpace(spaceHandle);
    return space && space.tools.texts.get(textHandle);
}

function GetTextObject2d(ctx: ExecutionContext) {
    const objectHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.pushLong(0);
        return;
    }
    const obj = space.getObject(objectHandle);
    ctx.pushLong(obj && obj.type === "otTEXT2D" ? obj.textTool.handle : 0);
}

function GetTextCount2d(ctx: ExecutionContext) {
    const textHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.pushDouble(text ? text.textCount : 0);
}

function GetTextString2d(ctx: ExecutionContext) {
    const textHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.pushLong(text ? text.getFragment(0).stringFragment.handle : 0);
}

function GetString2d(ctx: ExecutionContext) {
    const stringHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.pushString("");
        return;
    }
    const tool = space.tools.strings.get(stringHandle);
    ctx.pushString(tool ? tool.text : "");
}

function GetTextFont2d(ctx: ExecutionContext) {
    const textHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.pushLong(text ? text.getFragment(0).font.handle : 0);
}

function GetTextFgColor2d(ctx: ExecutionContext) {
    const textHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.pushLong(text ? text.getFragment(0).foregroundColor : 0);
}

function GetTextBkColor2d(ctx: ExecutionContext) {
    const textHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const text = _getText(ctx, spaceHandle, textHandle);
    ctx.pushLong(text ? text.getFragment(0).backgroundColor : 0);
}

function CreateFont2d(ctx: ExecutionContext) {
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

function CreateString2d(ctx: ExecutionContext) {
    const value = ctx.popString();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    ctx.pushLong(space ? space.tools.createString(value).handle : 0);
}

function CreateText2d(ctx: ExecutionContext) {
    const bgColor = ctx.popLong();
    const fgColor = ctx.popLong();
    const stringHandle = ctx.popLong();
    const fontHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const space = ctx.windows.getSpace(spaceHandle);
    if (space) {
        const tool = space.tools.createText(fontHandle, stringHandle, fgColor, bgColor);
        if (tool) {
            ctx.pushLong(tool.handle);
            return;
        }
    }
    ctx.pushLong(0);
}

//HSpace,HText,HFont,HString,~FgColor,~BgColor
function SetText2d(ctx: ExecutionContext) {
    const bgColor = ctx.popLong();
    const fgColor = ctx.popLong();
    const stringHandle = ctx.popLong();
    const fontHandle = ctx.popLong();
    const textHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
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

//~HSpace,~HString,~text
function SetString2d(ctx: ExecutionContext) {
    const text = ctx.popString();
    const stringHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.pushDouble(0);
        return;
    }
    const stringTool = space.tools.strings.get(stringHandle);
    ctx.pushDouble(stringTool ? stringTool.setText(text) : 0);
}

function CreatePen2d(ctx: ExecutionContext) {
    const rop2 = ctx.popDouble();
    const color = ctx.popLong();
    const width = ctx.popDouble();
    const style = ctx.popDouble();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    ctx.pushLong(space ? space.tools.createPen(width, color, style).handle : 0);
}

// FLOAT SetPenROP2d(HANDLE HSpace, HANDLE HPen, FLOAT rop)
function SetPenROP2d(ctx: ExecutionContext) {
    const rop = ctx.popDouble();
    const penHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.pushDouble(0);
        return;
    }
    const pen = space.tools.pens.get(penHandle);
    ctx.pushDouble(pen ? 1 : 0);
}

// HANDLE CreateBrush2d(HANDLE HSpace, FLOAT Style, FLOAT Hatch, COLORREF Color, HANDLE HDib, FLOAT Type)
function CreateBrush2d(ctx: ExecutionContext) {
    const type = ctx.popDouble();
    const dibHandle = ctx.popLong();
    const color = ctx.popLong();
    const hatch = ctx.popDouble();
    const style = ctx.popDouble();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    ctx.pushLong(space ? space.tools.createBrush(color, style, dibHandle).handle : 0);
}

// FLOAT SetBrushColor2d(HANDLE HSpace, HANDLE HBrush, COLORREF Color)
function SetBrushColor2d(ctx: ExecutionContext) {
    const color = ctx.popLong();
    const brushHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.pushDouble(0);
        return;
    }
    const brush = space.tools.brushes.get(brushHandle);
    ctx.pushDouble(brush ? brush.setColor(color) : 0);
}

// FLOAT SetBrushROP2d(HANDLE HSpace, HANDLE HBrush, FLOAT rop)
function SetBrushROP2d(ctx: ExecutionContext) {
    const rop = ctx.popDouble();
    const brushHandle = ctx.popLong();
    const spaceHandle = ctx.popLong();

    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.pushDouble(0);
        return;
    }
    const brush = space.tools.brushes.get(brushHandle);
    ctx.pushDouble(brush ? 1 : 0);
}

// HANDLE CreateDIB2d(HANDLE HSpace, STRING FileName)
function CreateDIB2d(ctx: ExecutionContext) {
    const bmpFilename = ctx.popString();
    const spaceHandle = ctx.popLong();
    const space = ctx.windows.getSpace(spaceHandle);
    if (!space) {
        ctx.pushLong(0);
        return;
    }
    const stream = ctx.project.openFileStream(bmpFilename);
    if (!stream) {
        ctx.pushLong(0);
        return;
    }
    const tool = space.tools.createBitmap(stream);
    ctx.pushLong(tool ? tool.handle : 0);
}

export function initGraphicTools(addOperation: (opcode: number, operation: Operation) => void) {
    addOperation(OpCode.GETTEXTOBJECT2D, GetTextObject2d);
    addOperation(OpCode.VM_GETTEXTCOUNT2D, GetTextCount2d);
    addOperation(OpCode.GETTEXTSTRING2D, GetTextString2d);
    addOperation(OpCode.GETLOGSTRING2D, GetString2d);
    addOperation(OpCode.GETTEXTFONT2D, GetTextFont2d);
    addOperation(OpCode.GETTEXTFG2D, GetTextFgColor2d);
    addOperation(OpCode.GETTEXTBK2D, GetTextBkColor2d);
    addOperation(OpCode.CREATEFONT2D, CreateFont2d);
    addOperation(OpCode.CREATESTRING2D, CreateString2d);
    addOperation(OpCode.CREATETEXT2D, CreateText2d);
    addOperation(OpCode.VM_SETLOGTEXT2D, SetText2d);
    addOperation(OpCode.SETLOGSTRING2D, SetString2d);
    addOperation(OpCode.CREATEPEN2D, CreatePen2d);
    addOperation(OpCode.SETPENROP2D, SetPenROP2d);
    addOperation(OpCode.CREATEBRUSH2D, CreateBrush2d);
    addOperation(OpCode.SETBRUSHCOLOR2D, SetBrushColor2d);
    addOperation(OpCode.SETBRUSHROP2D, SetBrushROP2d);
    addOperation(OpCode.CREATEDID2D, CreateDIB2d);
}
