import { LineElement } from "stratum/fileFormats/vdr";
import { Point2D } from "stratum/helpers/types";
import { Optional, Require } from "stratum/helpers/utilityTypes";
import { NumBool } from "stratum/translator";
import { RenderableFactory, RenderableLine } from "../../interfaces";
import { SceneTools } from "../../sceneTools";
import { SceneBrushTool, ScenePenTool } from "../../tools";
import { Object2dMixin } from "./object2dMixin";

type omitKeys = "type" | "name" | "options" | "size" | "brushHandle" | "penHandle" | "position";

export type SceneLineObjectArgs = Optional<LineElement, omitKeys>;

export class SceneLineObject extends Object2dMixin {
    readonly type = "otLINE2D";
    readonly renderable: RenderableLine;
    private _pen: ScenePenTool | undefined;
    private _brush: SceneBrushTool | undefined;
    private points: Point2D[];

    static calculatePosition(points: Point2D[]): Point2D {
        let minX = points[0].x;
        let minY = points[0].y;
        for (const p of points) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
        }
        return { x: minX, y: minY };
    }

    static create(args: SceneLineObjectArgs, renderableFactory: RenderableFactory, tools?: SceneTools) {
        const position = args.position || this.calculatePosition(args.points);
        return new SceneLineObject({ ...args, position }, renderableFactory, tools);
    }

    constructor(args: Require<SceneLineObjectArgs, "position">, renderableFactory: RenderableFactory, tools?: SceneTools) {
        super(args);
        this.points = args.points.slice();

        if (args.penHandle) {
            const pen = tools && tools.pens.get(args.penHandle);
            // if (!pen) throw new NoSuchToolError("Карандаш", args.penHandle, "Линия", this.handle);
            this.changePen(pen);
        }

        if (args.brushHandle) {
            const brush = tools && tools.brushes.get(args.brushHandle);
            // if (!brush) throw new NoSuchToolError("Кисть", args.brushHandle, "Линия", this.handle);
            this.changeBrush(brush);
        }

        this.renderable = renderableFactory.createLine({
            handle: args.handle,
            position: args.position,
            isVisible: !!this.isVisible,
            selectable: !!this.isSelectable,
            points: this.points,
            pen: this.pen,
            brush: this.brush,
        });

        if (!args.size) {
            const area = this.renderable.getVisibleAreaSize();
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

    get hpen(): number {
        return this.pen !== undefined ? this.pen.handle : 0;
    }
    get hbrush(): number {
        return this.brush !== undefined ? this.brush.handle : 0;
    }

    pointX(index: number): number {
        const p = this.points[index];
        return p !== undefined ? p.x : 0;
    }

    pointY(index: number): number {
        const p = this.points[index];
        return p !== undefined ? p.y : 0;
    }

    setPointXY(index: number, x: number, y: number): NumBool {
        const p = this.points[index];
        if (p === undefined) return 0;
        if (p.x === x && p.y === y) return 1;
        p.x = x;
        p.y = y;
        this.renderable.setPointPosition(index, x, y);
        return 1;
    }

    addPoint(index: number, x: number, y: number): NumBool {
        if (index === -1) {
            this.points.push({ x, y });
        } else {
            this.points.splice(index, 0, { x, y });
        }
        this.renderable.addPoint(index, x, y);
        return 1;
    }

    changePen(value: ScenePenTool | undefined): NumBool {
        if (this.pen) this.pen.unsubscribe(this);
        if (value) value.subscribe(this, () => this.renderable.updatePen(value));
        this._pen = value;
        return 1;
    }

    changeBrush(value: SceneBrushTool | undefined): NumBool {
        if (this.brush) this.brush.unsubscribe(this);
        if (value) value.subscribe(this, () => this.renderable.updateBrush(value));
        this._brush = value;
        return 1;
    }

    unsubFromTools() {
        if (this.pen) this.pen.unsubscribe(this);
        if (this.brush) this.brush.unsubscribe(this);
    }
}
