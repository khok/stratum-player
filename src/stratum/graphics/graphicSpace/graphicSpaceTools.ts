import { StringColor } from "vdr-types";
import { VmBool } from "vm-interfaces-core";
import { GraphicSpaceToolsState, ToolTypes } from "vm-interfaces-gspace";
import { StratumError } from "~/helpers/errors";
import { HandleMap } from "~/helpers/handleMap";
import { BitmapToolFactory } from "./bitmapToolFactory";
import { BitmapTool, BrushTool, FontTool, PenTool, StringTool, TextTool } from "./tools";

export interface GraphicSpaceToolsData {
    bmpFactory: BitmapToolFactory;
    bitmaps?: HandleMap<BitmapTool>;
    brushes?: HandleMap<BrushTool>;
    doubleBitmaps?: HandleMap<BitmapTool>;
    fonts?: HandleMap<FontTool>;
    pens?: HandleMap<PenTool>;
    strings?: HandleMap<StringTool>;
    texts?: HandleMap<TextTool>;
}

/**
 * Контейнер инструментов графического пространства.
 */
export class GraphicSpaceTools implements GraphicSpaceToolsState {
    private bmpFactory?: BitmapToolFactory;
    private bitmaps: HandleMap<BitmapTool>;
    private brushes: HandleMap<BrushTool>;
    private doubleBitmaps: HandleMap<BitmapTool>;
    private fonts: HandleMap<FontTool>;
    private pens: HandleMap<PenTool>;
    private strings: HandleMap<StringTool>;
    private texts: HandleMap<TextTool>;

    constructor(data?: GraphicSpaceToolsData) {
        this.bmpFactory = data && data.bmpFactory;
        this.bitmaps = (data && data.bitmaps) || HandleMap.create<BitmapTool>();
        this.brushes = (data && data.brushes) || HandleMap.create<BrushTool>();
        this.doubleBitmaps = (data && data.doubleBitmaps) || HandleMap.create<BitmapTool>();
        this.fonts = (data && data.fonts) || HandleMap.create<FontTool>();
        this.pens = (data && data.pens) || HandleMap.create<PenTool>();
        this.strings = (data && data.strings) || HandleMap.create<StringTool>();
        this.texts = (data && data.texts) || HandleMap.create<TextTool>();
        if (!data) return;
        for (const k in data) {
            if (k === "bmpFactory") continue;
            const mp = (data as any)[k] as HandleMap<{ handle: number }> | undefined;
            if (mp) mp.forEach((c, handle) => (c.handle = handle));
        }
    }

    createBitmap(bmpFilename: string) {
        if (!this.bmpFactory) throw new StratumError("Отсутствует зависимость BitmapToolFactory!");
        const bmp = this.bmpFactory.fromProjectFile(bmpFilename, false);
        const handle = HandleMap.getFreeHandle(this.bitmaps);
        this.bitmaps.set(handle, bmp);
        bmp.handle = handle;
        return bmp;
    }

    createDoubleBitmap(bmpFilename: string) {
        if (!this.bmpFactory) throw new StratumError("Отсутствует зависимость BitmapToolFactory!");
        const bmp = this.bmpFactory.fromProjectFile(bmpFilename, true);
        const handle = HandleMap.getFreeHandle(this.doubleBitmaps);
        this.doubleBitmaps.set(handle, bmp);
        bmp.handle = handle;
        return bmp;
    }

    createFont(fontName: string, size: number, bold: boolean): FontTool {
        const font = new FontTool({ fontName, size, weight: +bold });
        const handle = HandleMap.getFreeHandle(this.fonts);
        this.fonts.set(handle, font);
        font.handle = handle;
        return font;
    }

    createPen(width: number, color: string): PenTool {
        const pen = new PenTool(width, color);
        const handle = HandleMap.getFreeHandle(this.pens);
        this.pens.set(handle, pen);
        pen.handle = handle;
        return pen;
    }

    createString(value: string): StringTool {
        const stringTool = new StringTool(value);
        const handle = HandleMap.getFreeHandle(this.strings);
        this.strings.set(handle, stringTool);
        stringTool.handle = handle;
        return stringTool;
    }

    createText(
        font: FontTool,
        stringFragment: StringTool,
        foregroundColor: StringColor,
        backgroundColor: StringColor
    ): TextTool {
        const textTool = new TextTool([{ font, stringFragment, foregroundColor, backgroundColor }]);
        const handle = HandleMap.getFreeHandle(this.texts);
        this.texts.set(handle, textTool);
        textTool.handle = handle;
        return textTool;
    }

    getTool(type: ToolTypes, handle: number) {
        switch (type) {
            case "ttPEN2D":
                return this.pens.get(handle);
            case "ttBRUSH2D":
                return this.brushes.get(handle);
            case "ttDIB2D":
                return this.bitmaps.get(handle);
            case "ttDOUBLEDIB2D":
                return this.doubleBitmaps.get(handle);
            case "ttFONT2D":
                return this.fonts.get(handle);
            case "ttSTRING2D":
                return this.strings.get(handle);
            case "ttTEXT2D":
                return this.texts.get(handle);
        }
    }

    deleteTool(type: ToolTypes, handle: number): VmBool {
        switch (type) {
            case "ttPEN2D":
                return this.pens.delete(handle) ? 1 : 0;
            case "ttBRUSH2D":
                const brush = this.brushes.get(handle);
                if (!brush) return 0;
                brush.unsubFromBitmapTool();
                this.brushes.delete(handle);
                return 1;
            case "ttDIB2D":
                return this.bitmaps.delete(handle) ? 1 : 0;
            case "ttDOUBLEDIB2D":
                return this.doubleBitmaps.delete(handle) ? 1 : 0;
            case "ttFONT2D":
                return this.fonts.delete(handle) ? 1 : 0;
            case "ttSTRING2D":
                return this.strings.delete(handle) ? 1 : 0;
            case "ttTEXT2D":
                const text = this.texts.get(handle);
                if (!text) return 0;
                text.unsubFromTools();
                this.texts.delete(handle);
                return 1;
        }
    }
}
