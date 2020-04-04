import { LineElementData, Point2D } from "data-types-graphics";
import { LineElementVisual, VisualFactory } from "scene-types";
import { GraphicSpaceToolsState, LineObjectState } from "vm-interfaces-graphics";
import { BrushTool, PenTool } from "../../tools";
import { Object2dMixin } from "./object2dMixin";
import { VmBool } from "vm-interfaces-base";

export class LineObject extends Object2dMixin implements LineObjectState {
    readonly type = "otLINE2D";
    private _pen: PenTool | undefined;
    private _brush: BrushTool | undefined;
    protected readonly _subclassInstance: this = this;
    visual: LineElementVisual;
    points: Point2D[];
    constructor(data: LineElementData, tools: GraphicSpaceToolsState, visualFactory: VisualFactory) {
        super(data);
        this.points = data.points.slice();
        const pen = tools.getTool<PenTool>("ttPEN2D", data.penHandle);
        const brush = tools.getTool<BrushTool>("ttBRUSH2D", data.brushHandle);
        this.visual = visualFactory.createLine({
            handle: data.handle,
            position: data.position,
            options: data.options,
            size: data.size,
            points: this.points,
            isVisible: !!this.isVisible,
            selectable: !!this.selectable,
            pen,
            brush,
        });
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
        this.visual.setPoints(this.points);
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
