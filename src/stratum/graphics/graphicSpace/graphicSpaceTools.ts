import { VmBool } from "vm-interfaces-base";
import { GraphicSpaceToolsState, ToolState } from "vm-interfaces-graphics";
import { HandleMap } from "~/helpers/handleMap";
import { BrushTool, PenTool, BitmapTool, DoubleBitmapTool } from "./tools";

/**
 * Инструменты графического пространства.
 */
export class GraphicSpaceTools implements GraphicSpaceToolsState {
    private brushes: HandleMap<BrushTool>;
    private pens: HandleMap<PenTool>;
    private bitmaps: HandleMap<BitmapTool>;
    private doubleBitmaps: HandleMap<DoubleBitmapTool>;

    constructor(data?: {
        brushes?: HandleMap<BrushTool>;
        pens?: HandleMap<PenTool>;
        bitmaps?: HandleMap<BitmapTool>;
        doubleBitmaps?: HandleMap<DoubleBitmapTool>;
    }) {
        this.brushes = (data && data.brushes) || HandleMap.create<BrushTool>();
        this.pens = (data && data.pens) || HandleMap.create<PenTool>();
        this.bitmaps = (data && data.bitmaps) || HandleMap.create<BitmapTool>();
        this.doubleBitmaps = (data && data.doubleBitmaps) || HandleMap.create<DoubleBitmapTool>();
    }
    addTool(handle: number, tool: PenTool | BrushTool): void {
        switch (tool.type) {
            case "ttPEN2D":
                this.pens.set(handle, tool);
                break;
            case "ttBRUSH2D":
                this.brushes.set(handle, tool);
                break;
        }
        throw new Error(`Неизвестный тип инструмента: ${tool.type}`);
    }
    getTool<T extends ToolState>(type: ToolState["type"], handle: number): T | undefined {
        switch (type) {
            case "ttPEN2D":
                return this.pens.get(handle) as T | undefined;
            case "ttBRUSH2D":
                return this.brushes.get(handle) as T | undefined;
            case "ttDIB2D":
                return this.bitmaps.get(handle) as T | undefined;
            case "ttDOUBLEDIB2D":
                return this.doubleBitmaps.get(handle) as T | undefined;
        }
        throw new Error(`Неизвестный тип инструмента: ${type}`);
    }

    deleteTool(type: ToolState["type"], handle: number): VmBool {
        switch (type) {
            case "ttPEN2D":
                return this.pens.delete(handle) ? 1 : 0;
            case "ttBRUSH2D":
                return this.brushes.delete(handle) ? 1 : 0;
        }
        throw new Error(`Неизвестный тип инструмента: ${type}`);
    }
}
