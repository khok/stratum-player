import { Point2D } from "vdr-types";
import { LineElementVisual, VisualFactory } from "scene-types";
import { VmBool } from "vm-interfaces-core";
import { GraphicSpaceToolsState, LineObjectState } from "vm-interfaces-gspace";
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
            selectable: !!this.isSelectable,
            points: this.points,
            pen,
            brush,
        });
        if (!data.size) {
            const area = this.visual.getVisibleAreaSize();
            this.width = area.x;
            this.height = area.y;
        }
        this.changePen(pen);
        this.changeBrush(brush);
    }

    get pen() {
        return this._pen;
    }

    get brush() {
        return this._brush;
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

    addPoint(index: number, x: number, y: number): VmBool {
        if (index === -1) {
            this.points.push({ x, y });
        } else {
            this.points.splice(index, 0, { x, y });
        }
        this.visual.addPoint(index, x, y);
        return 1;
    }

    changePen(value: PenTool | undefined): VmBool {
        if (this.pen) this.pen.unsubscribe(this);
        if (value) value.subscribe(this, () => this.visual.updatePen(value));
        this._pen = value;
        return 1;
    }

    changeBrush(value: BrushTool | undefined): VmBool {
        if (this.brush) this.brush.unsubscribe(this);
        if (value) value.subscribe(this, () => this.visual.updateBrush(value));
        this._brush = value;
        return 1;
    }

    protected unsubFromTools() {
        if (this.pen) this.pen.unsubscribe(this);
        if (this.brush) this.brush.unsubscribe(this);
    }
}
