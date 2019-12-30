import { LineElementData } from "data-types-graphics";
import { LineElementVisual, VisualFactory } from "scene-types";
import { GraphicSpaceToolsState, LineObjectState } from "vm-interfaces-graphics";
import { BrushTool, PenTool } from "../../tools";
import { Object2dMixin } from "./object2dMixin";

export class LineObject extends Object2dMixin implements LineObjectState {
    readonly type = "otLINE2D";
    private _pen: PenTool | undefined;
    private _brush: BrushTool | undefined;
    protected readonly _subclassInstance: this = this;
    visual: LineElementVisual;
    constructor(data: LineElementData, tools: GraphicSpaceToolsState, visualFactory: VisualFactory) {
        super(data);
        const pen = tools.getTool<PenTool>("ttPEN2D", data.penHandle);
        const brush = tools.getTool<BrushTool>("ttBRUSH2D", data.brushHandle);
        this.visual = visualFactory.createLine({
            handle: data.handle,
            position: data.position,
            size: data.size,
            points: data.points,
            isVisible: !!this.isVisible,
            selectable: !!this.selectable,
            pen,
            brush
        });
        this.pen = pen;
        this.brush = brush;
    }
    get pen() {
        return this._pen;
    }
    set pen(value) {
        if (this.pen) this.pen.unsubscribe(this);
        if (value) value.subscribe(this, p => this.visual.updatePen(p));
        this._pen = value;
    }
    get brush() {
        return this._brush;
    }
    set brush(value) {
        if (this.brush) this.brush.unsubscribe(this);
        if (value) value.subscribe(this, b => this.visual.updateBrush(b));
        this._brush = value;
    }
    unsubFromTools() {
        if (this.pen) this.pen.unsubscribe(this);
        if (this.brush) this.brush.unsubscribe(this);
    }
    testlineFunc() {}
}
