import { Point2D } from "data-types-graphics";
import { LineElementVisual, VisualFactory } from "scene-types";
import { VmBool } from "vm-interfaces-base";
import { GraphicSpaceToolsState, LineObjectState } from "vm-interfaces-graphics";
import { BrushTool, PenTool } from "../../tools";
import { Object2dMixin, Object2dOptions } from "./object2dMixin";

export interface LineObjectOptions extends Object2dOptions {
    penHandle?: number;
    brushHandle?: number;
    points: Point2D[];
}

export class LineObject extends Object2dMixin implements LineObjectState {
    readonly type = "otLINE2D";
    protected readonly _subclassInstance: this = this;
    private _pen: PenTool | undefined;
    private _brush: BrushTool | undefined;
    private points: Point2D[];
    visual: LineElementVisual;
    constructor(data: LineObjectOptions, tools: GraphicSpaceToolsState, visualFactory: VisualFactory) {
        super(data);
        this.points = data.points.slice();
        const pen = data.penHandle ? (tools.getTool("ttPEN2D", data.penHandle) as PenTool) : undefined;
        const brush = data.brushHandle ? (tools.getTool("ttBRUSH2D", data.brushHandle) as BrushTool) : undefined;
        this.visual = visualFactory.createLine({
            handle: data.handle,
            position: data.position,
            isVisible: !!this.isVisible,
            selectable: !!this.selectable,
            options: data.options,
            points: this.points,
            pen,
            brush,
        });
        if (!data.size) {
            const area = this.visual.getVisibleAreaSize();
            this.width = area.x;
            this.height = area.y;
        }
        this.pen = pen;
        this.brush = brush;
    }
    getPoint(index: number): Point2D {
        return this.points[index];
    }
    setPointPosition(index: number, x: number, y: number): VmBool {
        const p = this.points[index];
        if (!p) return 0;
        if (p.x === x && p.y === y) return 1;
        p.x = x;
        p.y = y;
        this.visual.setPointPosition(index, x, y);
        return 1;
    }
    get pen() {
        return this._pen;
    }
    set pen(value) {
        if (this.pen) this.pen.unsubscribe(this);
        if (value) value.subscribe(this, () => this.visual.updatePen(value));
        this._pen = value;
    }
    get brush() {
        return this._brush;
    }
    set brush(value) {
        if (this.brush) this.brush.unsubscribe(this);
        if (value) value.subscribe(this, () => this.visual.updateBrush(value));
        this._brush = value;
    }
    protected unsubFromTools() {
        if (this.pen) this.pen.unsubscribe(this);
        if (this.brush) this.brush.unsubscribe(this);
    }
}
