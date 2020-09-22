import { BinaryStream } from "~/helpers/binaryStream";
import { HandleMap } from "~/helpers/handleMap";
import { GraphicSpaceTools, GraphicSpaceToolType } from "~/vm/interfaces/graphicSpace";
import { NumBool } from "~/vm/types";
import { BmpToolFactory } from ".";
import { SceneBmpTool, SceneBrushTool, SceneFontTool, ScenePenTool, SceneStringTool, SceneTextTool } from "./tools";

export interface GraphicSpaceToolsData {
    bitmaps?: HandleMap<SceneBmpTool>;
    brushes?: HandleMap<SceneBrushTool>;
    doubleBitmaps?: HandleMap<SceneBmpTool>;
    fonts?: HandleMap<SceneFontTool>;
    pens?: HandleMap<ScenePenTool>;
    strings?: HandleMap<SceneStringTool>;
    texts?: HandleMap<SceneTextTool>;
}

/**
 * Контейнер инструментов графического пространства.
 */
export class SceneTools implements GraphicSpaceTools {
    readonly bitmaps: HandleMap<SceneBmpTool>;
    readonly brushes: HandleMap<SceneBrushTool>;
    readonly doubleBitmaps: HandleMap<SceneBmpTool>;
    readonly fonts: HandleMap<SceneFontTool>;
    readonly pens: HandleMap<ScenePenTool>;
    readonly strings: HandleMap<SceneStringTool>;
    readonly texts: HandleMap<SceneTextTool>;

    constructor(data: GraphicSpaceToolsData = {}) {
        this.bitmaps = data.bitmaps || HandleMap.create();
        this.brushes = data.brushes || HandleMap.create();
        this.doubleBitmaps = data.doubleBitmaps || HandleMap.create();
        this.fonts = data.fonts || HandleMap.create();
        this.pens = data.pens || HandleMap.create();
        this.strings = data.strings || HandleMap.create();
        this.texts = data.texts || HandleMap.create();
    }

    createBitmap(stream: BinaryStream): SceneBmpTool | undefined {
        const handle = HandleMap.getFreeHandle(this.bitmaps);
        const bmp = BmpToolFactory.loadFromStream(stream, handle, false);
        if (!bmp) return undefined;
        this.bitmaps.set(handle, bmp);
        return bmp;
    }

    createBrush(color: number, style: number, dibHandle: number): SceneBrushTool {
        const handle = HandleMap.getFreeHandle(this.brushes);
        const brush = new SceneBrushTool({ handle, color, style, dibHandle }, this.bitmaps);
        this.brushes.set(handle, brush);
        return brush;
    }

    createDoubleBitmap(stream: BinaryStream): SceneBmpTool | undefined {
        const handle = HandleMap.getFreeHandle(this.doubleBitmaps);
        const bmp = BmpToolFactory.loadFromStream(stream, handle, false);
        if (!bmp) return undefined;
        this.doubleBitmaps.set(handle, bmp);
        return bmp;
    }

    createFont(fontName: string, size: number, bold: boolean): SceneFontTool {
        const handle = HandleMap.getFreeHandle(this.fonts);
        const font = new SceneFontTool({ handle, fontName, size, weight: +bold });
        this.fonts.set(handle, font);
        return font;
    }

    createPen(width: number, color: number, style: number): ScenePenTool {
        const handle = HandleMap.getFreeHandle(this.pens);
        const pen = new ScenePenTool({ handle, width, color, style });
        this.pens.set(handle, pen);
        return pen;
    }

    createString(text: string): SceneStringTool {
        const handle = HandleMap.getFreeHandle(this.strings);
        const stringTool = new SceneStringTool({ handle, text });
        this.strings.set(handle, stringTool);
        return stringTool;
    }

    createText(fontHandle: number, stringHandle: number, foregroundColor: number, backgroundColor: number): SceneTextTool | undefined {
        const handle = HandleMap.getFreeHandle(this.texts);
        const textCollection = [{ fontHandle, stringHandle, foregroundColor, backgroundColor }];
        const textTool = SceneTextTool.create({ handle, textCollection }, this.fonts, this.strings);
        if (!textTool) return undefined;
        this.texts.set(handle, textTool);
        return textTool;
    }

    deleteTool(type: GraphicSpaceToolType, handle: number): NumBool {
        switch (type) {
            case "ttDIB2D":
                return this.bitmaps.delete(handle) ? 1 : 0;
            case "ttBRUSH2D":
                const brush = this.brushes.get(handle);
                if (!brush) return 0;
                brush.unsubFromBmpTool();
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
    merge(tools: SceneTools) {
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
