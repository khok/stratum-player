import { NumBool } from "stratum/common/types";
import { Hyperbase } from "stratum/fileFormats/vdr";
import { Scene, SceneVisualMember } from "./scene";
import { SceneGroup } from "./sceneGroup";
import { BrushTool } from "./tools/brushTool";
import { PenTool } from "./tools/penTool";
import { ToolSubscriber } from "./tools/toolSubscriber";

export interface SceneLineArgs {
    handle: number;
    options?: number;
    name?: string;
    hyperbase?: Hyperbase;
    coords: number[];
    penHandle: number;
    brushHandle: number;
}

export class SceneLine implements SceneVisualMember, ToolSubscriber {
    readonly type = "line";
    private scene: Scene;

    private pen: PenTool | null;
    private brush: BrushTool | null;

    private cnv: HTMLCanvasElement;
    private ctx2: CanvasRenderingContext2D;
    private needRedraw: boolean;

    private coords: number[];
    private _originX: number;
    private _originY: number;
    private _width: number;
    private _height: number;
    private _visible: boolean;
    private _selectable: number;
    private _layer: number;
    private _parent: SceneGroup | null;

    handle: number;
    name: string;
    markDeleted: boolean;
    hyperbase: Hyperbase | null;

    constructor(scene: Scene, { hyperbase, handle, name, options, coords, penHandle, brushHandle }: SceneLineArgs) {
        if (coords.length < 2) throw Error("Линия не имеет точек");
        this.hyperbase = hyperbase ?? null;

        this.scene = scene;
        this.handle = handle;
        this.name = name || "";

        this.cnv = document.createElement("canvas");
        const ctx = this.cnv.getContext("2d", { alpha: true });
        if (!ctx) throw Error("Не удалось инициализировать контекст рендеринга");
        this.ctx2 = ctx;
        this.markDeleted = false;
        this.needRedraw = true;
        scene.dirty = true;

        let minX = coords[0];
        let minY = coords[1];
        let maxX = minX;
        let maxY = minY;
        for (let i = 2; i < coords.length; i += 2) {
            const x = coords[i + 0];
            const y = coords[i + 1];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
        this.coords = coords.slice();
        for (let i = 0; i < coords.length; i += 2) {
            this.coords[i + 0] -= minX;
            this.coords[i + 1] -= minY;
        }
        this._originX = minX;
        this._originY = minY;
        this._width = maxX - minX;
        this._height = maxY - minY;

        const opts = options || 0;
        // this._visible = opts & 1 ? 0 : 1;
        this._visible = true;
        this._selectable = opts & 8 ? 0 : 1;
        const layerNumber = (opts >> 8) & 0b11111;
        this._layer = 1 << layerNumber;
        this._parent = null;

        this.pen = scene.pens.get(penHandle) || null;
        this.brush = scene.brushes.get(brushHandle) || null;

        this.pen?.subscribe(this);
        this.brush?.subscribe(this);
    }

    parentHandle(): number {
        return this._parent?.handle || 0;
    }

    originX(): number {
        const mat = this.scene.invMatrix;
        const realX = this._originX;
        const realY = this._originY;

        const w = realX * mat[2] + realY * mat[5] + mat[8];
        return (realX * mat[0] + realY * mat[3] + mat[6]) / w;
    }
    originY(): number {
        const mat = this.scene.invMatrix;
        const realX = this._originX;
        const realY = this._originY;

        const w = realX * mat[2] + realY * mat[5] + mat[8];
        return (realX * mat[1] + realY * mat[4] + mat[7]) / w;
    }
    setOrigin(x: number, y: number): NumBool {
        const mat = this.scene.matrix;
        const w = x * mat[2] + y * mat[5] + mat[8];
        const realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        const realY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        this._originX = realX;
        this._originY = realY;
        this._parent?.updateBorders();
        this.scene.dirty = true;
        return 1;
    }

    width(): number {
        return this._width;
    }
    actualWidth(): number {
        return this._width;
    }
    height(): number {
        return this._height;
    }
    actualHeight(): number {
        return this._height;
    }
    setSize(width: number, height: number): NumBool {
        if (width < 0 || height < 0) return 0;
        const w = this._width;
        const h = this._height;
        if (w === 0 || h === 0) return 1;
        this.onParentResized(this._originX, this._originY, width / w, height / h);
        this._parent?.updateBorders();
        return 1;
    }

    angle(): number {
        return 0;
    }
    rotate(centerX: number, centerY: number, angle: number): NumBool {
        if (angle === 0) return 1;
        this.onParentRotated(centerX, centerY, angle);
        this._parent?.updateBorders();
        return 1;
    }

    setVisibility(visible: boolean): NumBool {
        this._visible = visible;
        this.scene.dirty = true;
        return 1;
    }

    // line methods
    pointOriginX(index: number): number {
        const coordIdx = index * 2;
        if (coordIdx < 0 || coordIdx >= this.coords.length) return 0;

        const mat = this.scene.invMatrix;
        const realX = this.coords[coordIdx + 0] + this._originX;
        const realY = this.coords[coordIdx + 1] + this._originY;

        const w = realX * mat[2] + realY * mat[5] + mat[8];
        return (realX * mat[0] + realY * mat[3] + mat[6]) / w;
    }

    pointOriginY(index: number): number {
        const coordIdx = index * 2;
        if (coordIdx < 0 || coordIdx >= this.coords.length) return 0;

        const mat = this.scene.invMatrix;
        const realX = this.coords[coordIdx + 0] + this._originX;
        const realY = this.coords[coordIdx + 1] + this._originY;

        const w = realX * mat[2] + realY * mat[5] + mat[8];
        return (realX * mat[1] + realY * mat[4] + mat[7]) / w;
    }

    private updateSize() {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (let i = 0; i < this.coords.length; i += 2) {
            const x = this.coords[i + 0];
            const y = this.coords[i + 1];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
        if (minX !== 0 || minY !== 0) {
            for (let i = 0; i < this.coords.length; i += 2) {
                this.coords[i + 0] -= minX;
                this.coords[i + 1] -= minY;
            }
            this._originX += minX;
            this._originY += minY;
        }
        this._width = maxX - minX;
        this._height = maxY - minY;

        this._parent?.updateBorders();
        this.scene.dirty = true;
        this.needRedraw = true;
    }

    setPointOrigin(index: number, x: number, y: number): NumBool {
        const coordIdx = index * 2;
        if (coordIdx < 0 || coordIdx >= this.coords.length) return 0;

        const mat = this.scene.matrix;
        const w = x * mat[2] + y * mat[5] + mat[8];
        const realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        const realY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        const localX = realX - this._originX;
        const localY = realY - this._originY;

        this.coords[coordIdx + 0] = localX;
        this.coords[coordIdx + 1] = localY;

        this.updateSize();
        return 1;
    }

    addPoint(index: number, x: number, y: number): NumBool {
        if (Math.floor(index) === 0) return 0;

        const mat = this.scene.matrix;
        const w = x * mat[2] + y * mat[5] + mat[8];
        const realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        const realY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        const localX = realX - this._originX;
        const localY = realY - this._originY;

        const coordIdx = index * 2;
        if (coordIdx < 0 || coordIdx >= this.coords.length) {
            this.coords.push(localX, localY);
        } else {
            this.coords.splice(coordIdx, 0, localX, localY);
        }
        this.updateSize();
        return 1;
    }

    deletePoint(index: number): NumBool {
        const coordIdx = index * 2;
        if (index < 0 || coordIdx > this.coords.length) return 0;

        this.coords.splice(coordIdx, 2);
        this.updateSize();
        return 1;
    }

    pointCount(): number {
        return this.coords.length / 2;
    }

    penHandle(): number {
        return this.pen ? this.pen.handle : 0;
    }
    brushHandle(): number {
        return this.brush ? this.brush.handle : 0;
    }

    // scene
    delete(): void {
        this.pen?.unsubscribe(this);
        this.brush?.unsubscribe(this);
        this._parent?.removeChild(this);
        this.markDeleted = true;
        this.scene.dirty = true;
    }

    getChildByName(name: string): number {
        return this.name === name ? this.handle : 0;
    }

    minX(): number {
        return this._originX;
    }
    minY(): number {
        return this._originY;
    }
    maxX(): number {
        return this._originX + this._width;
    }
    maxY(): number {
        return this._originY + this._height;
    }
    onParentChanged(parent: SceneGroup | null) {
        if (parent === this._parent) return;
        this._parent?.removeChild(this);
        this._parent = parent;
    }
    onParentMoved(dx: number, dy: number) {
        this._originX += dx;
        this._originY += dy;
        this.scene.dirty = true;
    }
    onParentResized(centerX: number, centerY: number, dx: number, dy: number) {
        this._originX = centerX + (this._originX - centerX) * dx;
        this._originY = centerY + (this._originY - centerY) * dy;

        for (let i = 0; i < this.coords.length; i += 2) {
            this.coords[i + 0] *= dx;
            this.coords[i + 1] *= dy;
        }

        this._width *= dx;
        this._height *= dy;
        this.needRedraw = true;
        this.scene.dirty = true;
    }
    onParentRotated(centerX: number, centerY: number, angle: number) {
        const cx = centerX - this._originX;
        const cy = centerY - this._originY;
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        for (let i = 0; i < this.coords.length; i += 2) {
            // translate point back to origin:
            const px = this.coords[i + 0] - cx;
            const py = this.coords[i + 1] - cy;

            // rotate point & translate point back:
            const xnew = px * c - py * s + cx;
            const ynew = px * s + py * c + cy;

            this.coords[i + 0] = xnew;
            this.coords[i + 1] = ynew;
            if (xnew < minX) minX = xnew;
            if (xnew > maxX) maxX = xnew;
            if (ynew < minY) minY = ynew;
            if (ynew > maxY) maxY = ynew;
        }
        for (let i = 0; i < this.coords.length; i += 2) {
            this.coords[i + 0] -= minX;
            this.coords[i + 1] -= minY;
        }
        this._originX += minX;
        this._originY += minY;
        this._width = maxX - minX;
        this._height = maxY - minY;

        this.scene.dirty = true;
        this.needRedraw = true;
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

    render(ctx: CanvasRenderingContext2D, sceneX: number, sceneY: number, layers: number) {
        if (!this._visible || (this._layer & layers) !== 0) return;
        const pw = this.pen ? this.pen.width() || 1 : 0;
        const ox = this._originX - sceneX - pw;
        const oy = this._originY - sceneY - pw;

        const brush = (this.coords.length > 4 && this.brush?.fillStyle(ctx)) || null;
        const pen = this.pen?.strokeStyle() || null;
        if (!brush && !pen) {
            return;
        }

        if (this._width * this._height > 4194304) {
            this._selectable = 0;
            SceneLine.drawFigure(ctx, ox, oy, this.coords, brush, pen, pw);
            return;
        }
        if (this.needRedraw) {
            this.cnv.width = Math.max(this._width + pw * 2, 1);
            this.cnv.height = Math.max(this._height + pw * 2, 1);
            SceneLine.drawFigure(this.ctx2, 0, 0, this.coords, brush, pen, pw);
            this.needRedraw = false;
        }
        ctx.drawImage(this.cnv, ox, oy);
    }

    tryClick(x: number, y: number, layers: number): this | SceneGroup | undefined {
        if (!this._visible || (this._layer & layers) !== 0 || this._selectable === 0) return undefined;

        const pw = this.pen ? this.pen.width() || 1 : 0;
        const ox = x - this._originX;
        const oy = y - this._originY;
        if (ox < -pw || oy < -pw || ox > this._width + pw || oy > this._height + pw) return undefined;

        if (this.ctx2.getImageData(ox, oy, 1, 1).data[3] === 0) return undefined;

        return this._parent ? this._parent.root() : this;
    }

    toolChanged() {
        this.needRedraw = true;
        this.scene.dirty = true;
    }

    //#region stubs
    textToolHandle(): number {
        return 0;
    }
    controlText(): string {
        return "";
    }
    setControlText(): NumBool {
        return 0;
    }
    setBitmapRect(): NumBool {
        return 0;
    }
    itemHandle(): number {
        return 0;
    }
    deleteItem(): NumBool {
        return 0;
    }
    addItem(): NumBool {
        return 0;
    }
    dibHandle(): number {
        return 0;
    }
    doubleDIBHandle(): number {
        return 0;
    }
    //#endregion
}
