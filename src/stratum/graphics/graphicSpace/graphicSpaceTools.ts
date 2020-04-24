import { VmBool } from "vm-interfaces-core";
import { GraphicSpaceToolsState, ToolTypes } from "vm-interfaces-gspace";
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
    private bmpFactory: BitmapToolFactory;
    private bitmaps: HandleMap<BitmapTool>;
    private brushes: HandleMap<BrushTool>;
    private doubleBitmaps: HandleMap<BitmapTool>;
    private fonts: HandleMap<FontTool>;
    private pens: HandleMap<PenTool>;
    private strings: HandleMap<StringTool>;
    private texts: HandleMap<TextTool>;

    constructor(data: GraphicSpaceToolsData) {
        this.bmpFactory = data.bmpFactory;
        this.bitmaps = data.bitmaps || HandleMap.create<BitmapTool>();
        this.brushes = data.brushes || HandleMap.create<BrushTool>();
        this.doubleBitmaps = data.doubleBitmaps || HandleMap.create<BitmapTool>();
        this.fonts = data.fonts || HandleMap.create<FontTool>();
        this.pens = data.pens || HandleMap.create<PenTool>();
        this.strings = data.strings || HandleMap.create<StringTool>();
        this.texts = data.texts || HandleMap.create<TextTool>();
    }

    createBitmap(bmpFilename: string) {
        const handle = HandleMap.getFreeHandle(this.bitmaps);
        const bmp = this.bmpFactory.fromProjectFile(handle, bmpFilename, false);
        this.bitmaps.set(handle, bmp);
        return bmp;
    }

    createDoubleBitmap(bmpFilename: string) {
        const handle = HandleMap.getFreeHandle(this.doubleBitmaps);
        const bmp = this.bmpFactory.fromProjectFile(handle, bmpFilename, true);
        this.doubleBitmaps.set(handle, bmp);
        return bmp;
    }

    createFont(fontName: string, size: number, bold: boolean): FontTool {
        const handle = HandleMap.getFreeHandle(this.fonts);
        const font = new FontTool({ handle, fontName, size, weight: +bold });
        this.fonts.set(handle, font);
        return font;
    }

    createPen(width: number, color: number): PenTool {
        const handle = HandleMap.getFreeHandle(this.pens);
        const pen = new PenTool({ handle, width, color });
        this.pens.set(handle, pen);
        return pen;
    }

    createBrush(color: number, style: number, dibHandle: number): BrushTool {
        const handle = HandleMap.getFreeHandle(this.brushes);
        const brush = new BrushTool({ handle, color, style, dibHandle }, this.bitmaps);
        this.brushes.set(handle, brush);
        return brush;
    }

    createString(text: string): StringTool {
        const handle = HandleMap.getFreeHandle(this.strings);
        const stringTool = new StringTool({ handle, text });
        this.strings.set(handle, stringTool);
        return stringTool;
    }

    createText(fontHandle: number, stringHandle: number, foregroundColor: number, backgroundColor: number): TextTool {
        const handle = HandleMap.getFreeHandle(this.texts);
        const textCollection = [{ fontHandle, stringHandle, foregroundColor, backgroundColor }];
        const textTool = new TextTool({ handle, textCollection }, this.fonts, this.strings);
        this.texts.set(handle, textTool);
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
