import { VmBool } from "vm-interfaces-base";
import { GraphicSpaceToolsState, ToolState } from "vm-interfaces-graphics";
import { HandleMap } from "~/helpers/handleMap";
import { BitmapTool, BrushTool, DoubleBitmapTool, FontTool, PenTool, StringTool, TextTool } from "./tools";
import { StringColor } from "data-types-graphics";

/**
 * Контейнер инструментов графического пространства.
 */
export class GraphicSpaceTools implements GraphicSpaceToolsState {
    private brushes: HandleMap<BrushTool>;
    private pens: HandleMap<PenTool>;
    private bitmaps: HandleMap<BitmapTool>;
    private doubleBitmaps: HandleMap<DoubleBitmapTool>;
    private fonts: HandleMap<FontTool>;
    private strings: HandleMap<StringTool>;
    private texts: HandleMap<TextTool>;

    constructor(data?: {
        brushes?: HandleMap<BrushTool>;
        pens?: HandleMap<PenTool>;
        bitmaps?: HandleMap<BitmapTool>;
        doubleBitmaps?: HandleMap<DoubleBitmapTool>;
        fonts?: HandleMap<FontTool>;
        strings?: HandleMap<StringTool>;
        texts?: HandleMap<TextTool>;
    }) {
        this.brushes = (data && data.brushes) || HandleMap.create<BrushTool>();
        this.pens = (data && data.pens) || HandleMap.create<PenTool>();
        this.bitmaps = (data && data.bitmaps) || HandleMap.create<BitmapTool>();
        this.doubleBitmaps = (data && data.doubleBitmaps) || HandleMap.create<DoubleBitmapTool>();
        this.fonts = (data && data.fonts) || HandleMap.create<FontTool>();
        this.strings = (data && data.strings) || HandleMap.create<StringTool>();
        this.texts = (data && data.texts) || HandleMap.create<TextTool>();
        if (!data) return;
        for (const k in data) {
            const mp = (data as any)[k] as HandleMap<{ handle: number }> | undefined;
            if (mp) mp.forEach((c, handle) => (c.handle = handle));
        }
    }
    createFont(fontName: string, size: number, style: number): FontTool {
        const font = new FontTool(fontName, size, style);
        const handle = HandleMap.getFreeHandle(this.fonts);
        this.fonts.set(handle, font);
        font.handle = handle;
        return font;
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
    // createTool(tool: PenTool | BrushTool | BitmapTool | DoubleBitmapTool | FontTool | StringTool | TextTool): number {
    //     switch (tool.type) {
    //         case "ttPEN2D": {
    //             const freeHandle = HandleMap.getFreeHandle(this.pens);
    //             this.pens.set(freeHandle, tool);
    //             return freeHandle;
    //         }
    //         case "ttBRUSH2D": {
    //             const freeHandle = HandleMap.getFreeHandle(this.brushes);
    //             this.brushes.set(freeHandle, tool);
    //             return freeHandle;
    //         }
    //         case "ttDIB2D": {
    //             const freeHandle = HandleMap.getFreeHandle(this.bitmaps);
    //             this.bitmaps.set(freeHandle, tool);
    //             return freeHandle;
    //         }
    //         case "ttDOUBLEDIB2D": {
    //             const freeHandle = HandleMap.getFreeHandle(this.doubleBitmaps);
    //             this.doubleBitmaps.set(freeHandle, tool);
    //             return freeHandle;
    //         }
    //         case "ttFONT2D": {
    //             const freeHandle = HandleMap.getFreeHandle(this.fonts);
    //             this.fonts.set(freeHandle, tool);
    //             return freeHandle;
    //         }
    //         case "ttSTRING2D": {
    //             const freeHandle = HandleMap.getFreeHandle(this.strings);
    //             this.strings.set(freeHandle, tool);
    //             return freeHandle;
    //         }
    //         case "ttTEXT2D": {
    //             const freeHandle = HandleMap.getFreeHandle(this.texts);
    //             this.texts.set(freeHandle, tool);
    //             return freeHandle;
    //         }
    //     }
    // }
    getTool<T extends ToolState>(type: ToolState["type"], handle: number): T | undefined {
        if (handle === 0) return undefined;
        switch (type) {
            case "ttPEN2D":
                return this.pens.get(handle) as T | undefined;
            case "ttBRUSH2D":
                return this.brushes.get(handle) as T | undefined;
            case "ttDIB2D":
                return this.bitmaps.get(handle) as T | undefined;
            case "ttDOUBLEDIB2D":
                return this.doubleBitmaps.get(handle) as T | undefined;
            case "ttFONT2D":
                return this.fonts.get(handle) as T | undefined;
            case "ttSTRING2D":
                return this.strings.get(handle) as T | undefined;
            case "ttTEXT2D":
                return this.texts.get(handle) as T | undefined;
        }
    }

    deleteTool(type: ToolState["type"], handle: number): VmBool {
        if (handle === 0) return 0;
        switch (type) {
            case "ttPEN2D":
                return this.pens.delete(handle) ? 1 : 0;
            case "ttBRUSH2D":
                return this.brushes.delete(handle) ? 1 : 0;
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
