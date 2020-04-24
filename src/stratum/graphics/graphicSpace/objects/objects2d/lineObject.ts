import { PartialOptionalData } from "other-types";
import { LineElementVisual, VisualFactory } from "scene-types";
import { LineElementData, Point2D } from "vdr-types";
import { VmBool } from "vm-interfaces-core";
import { LineObjectState } from "vm-interfaces-gspace";
import { StratumError } from "~/helpers/errors";
import { GraphicSpaceTools } from "../../graphicSpaceTools";
import { BrushTool, PenTool } from "../../tools";
import { Object2dMixin } from "./object2dMixin";

type omitKeys = "name" | "options" | "size" | "brushHandle" | "penHandle";

export type LineObjectOptions = PartialOptionalData<LineElementData, omitKeys>;

export class LineObject extends Object2dMixin implements LineObjectState {
    readonly type = "otLINE2D";
    readonly visual: LineElementVisual;
    private _pen: PenTool | undefined;
    private _brush: BrushTool | undefined;
    private points: Point2D[];
    constructor(data: LineObjectOptions, visualFactory: VisualFactory, tools?: GraphicSpaceTools) {
        super(data);
        this.points = data.points.slice();
        if (data.penHandle) {
            const pen = tools && tools.pens.get(data.penHandle);
            if (!pen) throw new StratumError(`Инструмент Карандаш ${data.penHandle} не существует`);
            this.changePen(pen);
        }
        if (data.brushHandle) {
            const brush = tools && tools.brushes.get(data.brushHandle);
            if (!brush) throw new StratumError(`Инструмент Кисть ${data.brushHandle} не существует`);
            this.changeBrush(brush);
        }
        this.visual = visualFactory.createLine({
            handle: data.handle,
            position: data.position,
            isVisible: !!this.isVisible,
            selectable: !!this.isSelectable,
            points: this.points,
            pen: this.pen,
            brush: this.brush,
        });
        if (!data.size) {
            const area = this.visual.getVisibleAreaSize();
            this.width = area.x;
            this.height = area.y;
        }
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

    unsubFromTools() {
        if (this.pen) this.pen.unsubscribe(this);
        if (this.brush) this.brush.unsubscribe(this);
    }
}
