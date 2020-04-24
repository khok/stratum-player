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
    readonly bmpFactory: BitmapToolFactory;
    readonly bitmaps: HandleMap<BitmapTool>;
    readonly brushes: HandleMap<BrushTool>;
    readonly doubleBitmaps: HandleMap<BitmapTool>;
    readonly fonts: HandleMap<FontTool>;
    readonly pens: HandleMap<PenTool>;
    readonly strings: HandleMap<StringTool>;
    readonly texts: HandleMap<TextTool>;

    constructor(data: GraphicSpaceToolsData) {
        this.bmpFactory = data.bmpFactory;
        this.bitmaps = data.bitmaps || HandleMap.create();
        this.brushes = data.brushes || HandleMap.create();
        this.doubleBitmaps = data.doubleBitmaps || HandleMap.create();
        this.fonts = data.fonts || HandleMap.create();
        this.pens = data.pens || HandleMap.create();
        this.strings = data.strings || HandleMap.create();
        this.texts = data.texts || HandleMap.create();
    }

    createBitmap(bmpFilename: string) {
        const handle = HandleMap.getFreeHandle(this.bitmaps);
        const bmp = this.bmpFactory.fromProjectFile(handle, bmpFilename, false);
        this.bitmaps.set(handle, bmp);
        return bmp;
    }

    createBrush(color: number, style: number, dibHandle: number): BrushTool {
        const handle = HandleMap.getFreeHandle(this.brushes);
        const brush = new BrushTool({ handle, color, style, dibHandle }, this.bitmaps);
        this.brushes.set(handle, brush);
        return brush;
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

    createPen(width: number, color: number, style: number): PenTool {
        const handle = HandleMap.getFreeHandle(this.pens);
        const pen = new PenTool({ handle, width, color, style });
        this.pens.set(handle, pen);
        return pen;
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

    deleteTool(type: ToolTypes, handle: number): VmBool {
        switch (type) {
            case "ttDIB2D":
                return this.bitmaps.delete(handle) ? 1 : 0;
            case "ttBRUSH2D":
                const brush = this.brushes.get(handle);
                if (!brush) return 0;
                brush.unsubFromBitmapTool();
                this.brushes.delete(handle);
                return 1;
            case "ttDOUBLEDIB2D":
                return this.doubleBitmaps.delete(handle) ? 1 : 0;
            case "ttFONT2D":
                return this.fonts.delete(handle) ? 1 : 0;
            case "ttPEN2D":
                return this.pens.delete(handle) ? 1 : 0;
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
    merge(tools: GraphicSpaceTools) {
        tools.bitmaps.forEach((t) => {
            const handle = HandleMap.getFreeHandle(this.bitmaps);
            t.handle = handle;
            this.bitmaps.set(handle, t);
        });
        tools.brushes.forEach((t) => {
            const handle = HandleMap.getFreeHandle(this.brushes);
            t.handle = handle;
            this.brushes.set(handle, t);
        });
        tools.doubleBitmaps.forEach((t) => {
            const handle = HandleMap.getFreeHandle(this.doubleBitmaps);
            t.handle = handle;
            this.doubleBitmaps.set(handle, t);
        });
        tools.fonts.forEach((t) => {
            const handle = HandleMap.getFreeHandle(this.fonts);
            t.handle = handle;
            this.fonts.set(handle, t);
        });
        tools.pens.forEach((t) => {
            const handle = HandleMap.getFreeHandle(this.pens);
            t.handle = handle;
            this.pens.set(handle, t);
        });
        tools.strings.forEach((t) => {
            const handle = HandleMap.getFreeHandle(this.strings);
            t.handle = handle;
            this.strings.set(handle, t);
        });
        tools.texts.forEach((t) => {
            const handle = HandleMap.getFreeHandle(this.texts);
            t.handle = handle;
            this.texts.set(handle, t);
        });
    }
}
