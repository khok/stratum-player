import { VectorDrawingTools } from "stratum/fileFormats/vdr";
import { HandleMap } from "stratum/helpers/handleMap";
import { BrushComponent } from "./components/brushComponent";
import { PenComponent } from "./components/penComponent";
import { ToolFactory } from "./toolFactory";

export class ToolManager {
    private pens: Map<number, PenComponent>;
    private brushes: Map<number, BrushComponent>;
    constructor(readonly factory: ToolFactory, tools: VectorDrawingTools) {
        const pens = tools.penTools?.map<[number, PenComponent]>((t) => [
            t.handle,
            factory.pen({ handle: t.handle, color: t.color, rop: t.rop2, width: t.width, style: t.style }),
        ]);
        const brushes = tools.brushTools?.map<[number, BrushComponent]>((t) => [
            t.handle,
            factory.brush({ handle: t.handle, color: t.color, rop: t.rop2, hatch: t.hatch, style: t.style }),
        ]);
        this.pens = new Map(pens);
        this.brushes = new Map(brushes);
    }
    pen(handle: number): PenComponent | null {
        return this.pens.get(handle) ?? null;
    }
    brush(handle: number): BrushComponent | null {
        return this.brushes.get(handle) ?? null;
    }

    createPen(style: number, width: number, color: number, rop2: number): PenComponent {
        const handle = HandleMap.getFreeHandle(this.pens);
        const pen = this.factory.pen({ handle, color, style, width, rop: rop2 });
        this.pens.set(handle, pen);
        return pen;
    }

    createBrush(style: number, hatch: number, color: number, hdib: number, rop: number): BrushComponent {
        const handle = HandleMap.getFreeHandle(this.pens);
        const brush = this.factory.brush({ handle, style, hatch, color, rop });
        this.brushes.set(handle, brush);
        return brush;
    }
}
