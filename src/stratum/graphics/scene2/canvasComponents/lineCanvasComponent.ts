import { BrushComponent } from "../components/brushComponent";
import { ClickableComponent } from "../components/clickableComponent";
import { LineComponent } from "../components/lineComponent";
import { PenComponent } from "../components/penComponent";
import { SceneOffsetComponent } from "../components/sceneOffsetComponent";
import { SelectableComponent } from "../components/selectableComponent";
import { ToolKeeperComponent } from "../components/toolKeeperComponent";
import { VisibilityComponent } from "../components/visibilityComponent";
import { BrushCanvasComponent } from "./brushCanvasComponent";
import { PenCanvasComponent } from "./penCanvasComponent";
import { Renderable } from "./renderable";

export interface LineCanvasComponentArgs {
    line: LineComponent;
    scene: SceneOffsetComponent;
    penKeeper: ToolKeeperComponent<PenComponent>;
    brushKeeper: ToolKeeperComponent<BrushComponent>;
    visib: VisibilityComponent;
    selectable: SelectableComponent;
}

export class LineCanvasComponent extends ClickableComponent implements Renderable {
    private line: LineComponent;
    private penKeeper: ToolKeeperComponent<PenComponent>;
    private _visib: VisibilityComponent;
    private scene: SceneOffsetComponent;
    private brushKeeper: ToolKeeperComponent<BrushComponent>;

    private cnv: HTMLCanvasElement;
    private localCtx: CanvasRenderingContext2D;
    private clickable: boolean = true;

    constructor({ line, penKeeper, brushKeeper, visib, selectable, scene }: LineCanvasComponentArgs) {
        super({ visib, selectable });

        this.scene = scene;
        this.cnv = document.createElement("canvas");
        const ctx = this.cnv.getContext("2d", { alpha: true });
        if (!ctx) throw Error("Не удалось инициализировать контекст рендеринга");
        this.localCtx = ctx;

        this.line = line;
        this.penKeeper = penKeeper;
        this.brushKeeper = brushKeeper;
        this._visib = visib;
        // const l = entity.line();
        // if (!l) throw Error("Сущность должна быть линией");
        // this.line = l;
        // const p = entity.penKeeper();
        // if (!p) throw Error("Сущность должна иметь карандаш");
        // this.pen = p;
        // const b = entity.brushKeeper();
        // if (!b) throw Error("Сущность должна иметь карандаш");
        // this.brush = b;
        // const v = entity.visibility();
        // if (!v) throw Error("Сущность должна иметь компонент visibility");
        // this.visib = v;
    }

    private static drawFigure(
        ctx: CanvasRenderingContext2D,
        ox: number,
        oy: number,
        coords: number[],
        brush: string | CanvasPattern | null,
        pen: string | null,
        penWidth: number
    ) {
        ctx.beginPath();
        ctx.moveTo(coords[0] + ox + penWidth, coords[1] + oy + penWidth);
        for (let i = 2; i < coords.length; i += 2) {
            ctx.lineTo(coords[i] + ox + penWidth, coords[i + 1] + oy + penWidth);
        }
        if (brush) {
            ctx.closePath();
            ctx.fillStyle = brush;
            ctx.fill("evenodd");
        }
        if (pen) {
            ctx.lineWidth = penWidth;
            ctx.strokeStyle = pen;
            ctx.stroke();
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        if (!this._visib.isVisible()) return;

        const coords = this.line.coords();
        const penTool = this.penKeeper.tool() as PenCanvasComponent | null;
        const brushTool = this.brushKeeper.tool() as BrushCanvasComponent | null;
        const pw = penTool ? penTool.width() || 1 : 0;
        const ox = this.line.minX() - this.scene.x() - pw;
        const oy = this.line.minY() - this.scene.y() - pw;

        const width = this.line.width();
        const height = this.line.height();

        const brush = (coords.length > 4 && brushTool?.fillStyle(ctx)) || null;
        const pen = penTool?.strokeStyle() || null;
        if (!brush && !pen) {
            return;
        }

        if (width * height > 4194304) {
            this.clickable = false;
            LineCanvasComponent.drawFigure(ctx, ox, oy, coords, brush, pen, pw);
            return;
        }
        this.clickable = true;

        const needRedraw = this.line.shapeChanged() || this.penKeeper.changed() || this.brushKeeper.changed();

        if (needRedraw) {
            this.cnv.width = Math.max(width + pw * 2, 1);
            this.cnv.height = Math.max(height + pw * 2, 1);
            LineCanvasComponent.drawFigure(this.localCtx, 0, 0, coords, brush, pen, pw);
        }

        const oper = brushTool?.compositeOperation() ?? "source-over";
        if (oper === "source-over") {
            ctx.drawImage(this.cnv, ox, oy);
        } else {
            ctx.globalCompositeOperation = oper;
            ctx.drawImage(this.cnv, ox, oy);
            ctx.globalCompositeOperation = "source-over";
        }

        this.line.reset();
        this.penKeeper.reset();
        this.brushKeeper.reset();
    }

    protected testPoint(x: number, y: number): boolean {
        if (!this.clickable) return false;
        const p = this.penKeeper.tool();
        const pw = p ? p.width() || 1 : 0;

        const ox = x - this.line.minX();
        const oy = y - this.line.minY();
        const width = this.line.width();
        const height = this.line.height();

        if (ox < -pw || oy < -pw || ox > width + pw || oy > height + pw) return false;

        return this.localCtx.getImageData(ox, oy, 1, 1).data[3] !== 0;
    }

    // tryClick(x: number, y: number, layers: number): this | SceneGroup | undefined {
    //     if (!this._visible || (this._layer & layers) !== 0 || this._selectable === 0) return undefined;

    //     const pw = this.pen ? this.pen.width() || 1 : 0;
    //     const ox = x - this._originX;
    //     const oy = y - this._originY;
    //     if (ox < -pw || oy < -pw || ox > this._width + pw || oy > this._height + pw) return undefined;

    //     if (this.ctx2.getImageData(ox, oy, 1, 1).data[3] === 0) return undefined;

    //     return this._parent ? this._parent.root() : this;
    // }
}
