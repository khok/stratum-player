import { Base64Image } from "stratum/fileFormats/bmp";
import { ExternalBmpToolParams, ExternalDoubleBmpToolParams, VectorDrawingToolParams } from "stratum/fileFormats/vdr";
import { HandleMap } from "stratum/helpers/handleMap";
import { NumBool } from "stratum/translator";
import { loadImage } from "./bmpToolFactory";
import { SceneBmpTool, SceneBrushTool, SceneFontTool, ScenePenTool, SceneStringTool, SceneTextTool } from "./tools";

type GraphicSpaceToolType = Exclude<VectorDrawingToolParams["type"], ExternalBmpToolParams["type"] | ExternalDoubleBmpToolParams["type"]>;

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
export class SceneTools {
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

    createBitmap(bmp: Base64Image): number {
        const handle = HandleMap.getFreeHandle(this.bitmaps);
        const { base64Image, width, height } = bmp;
        const tool = new SceneBmpTool({ handle, width, height });
        loadImage(base64Image).then((el) => tool.setImage(el));
        this.bitmaps.set(handle, tool);
        return handle;
    }

    createBrush(style: number, hatch: number, color: number, hdib: number, rop2: number): number {
        const handle = HandleMap.getFreeHandle(this.brushes);
        const brush = new SceneBrushTool({ handle, color, style, dibHandle: hdib, hatch, rop2 }, this.bitmaps);
        this.brushes.set(handle, brush);
        return handle;
    }

    createDoubleBitmap(dbm: Base64Image): number {
        const handle = HandleMap.getFreeHandle(this.doubleBitmaps);
        const { base64Image, width, height } = dbm;
        const tool = new SceneBmpTool({ handle, width, height });
        loadImage(base64Image).then((el) => tool.setImage(el));
        this.doubleBitmaps.set(handle, tool);
        return handle;
    }

    createFont(fontName: string, height: number, flags: number): number {
        const handle = HandleMap.getFreeHandle(this.fonts);
        const italic = !!(flags & 1);
        const underlined = !!(flags & 2);
        const strikeout = !!(flags & 4);
        const bold = !!(flags & 8);
        const font = new SceneFontTool({ handle, fontName, size: height, weight: +bold });
        this.fonts.set(handle, font);
        return handle;
    }

    createPen(style: number, width: number, color: number, rop2: number): number {
        const handle = HandleMap.getFreeHandle(this.pens);
        const pen = new ScenePenTool({ handle, width, color, style, rop2 });
        this.pens.set(handle, pen);
        return handle;
    }

    createString(value: string): number {
        const handle = HandleMap.getFreeHandle(this.strings);
        const stringTool = new SceneStringTool({ handle, text: value });
        this.strings.set(handle, stringTool);
        return handle;
    }

    createText(hfont: number, hstring: number, fgColor: number, bgColor: number): number {
        const handle = HandleMap.getFreeHandle(this.texts);
        const textCollection = [{ fontHandle: hfont, stringHandle: hstring, foregroundColor: fgColor, backgroundColor: bgColor }];
        const textTool = SceneTextTool.create({ handle, textCollection }, this.fonts, this.strings);
        if (textTool === undefined) return 0;
        this.texts.set(handle, textTool);
        return textTool.handle;
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
