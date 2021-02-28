import { NumBool } from "stratum/env";
import { Scene } from ".";
import { SceneVisualMember } from "./scene";
import { SceneGroup } from "./sceneGroup";
import { BrushTool } from "./tools/brushTool";
import { PenTool } from "./tools/penTool";
import { ToolSubscriber } from "./tools/toolSubscriber";

export interface SceneLineArgs {
    handle: number;
    options?: number;
    name?: string;
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
    private _visible: number;
    private _selectable: number;
    private _layer: number;
    private _parent: SceneGroup | null;

    handle: number;
    name: string;
    markDeleted: boolean;

    constructor(scene: Scene, { handle, name, options, coords, penHandle, brushHandle }: SceneLineArgs) {
        if (coords.length < 2) throw Error("Линия не имеет точек");

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
        this._visible = 1;
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
        return this._originX;
    }
    originY(): number {
        return this._originY;
    }
    setOrigin(x: number, y: number): NumBool {
        this._originX = x;
        this._originY = y;
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

    setShow(visible: number): NumBool {
        this._visible = visible;
        this.scene.dirty = true;
        return 1;
    }

    // line methods
    pointOriginX(index: number): number {
        const coordIdx = index * 2;
        if (coordIdx < 0 || coordIdx >= this.coords.length) return 0;
        return this.coords[coordIdx + 0] + this._originX;
    }

    pointOriginY(index: number): number {
        const coordIdx = index * 2;
        if (coordIdx < 0 || coordIdx >= this.coords.length) return 0;
        return this.coords[coordIdx + 1] + this._originY;
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

        const localX = x - this._originX;
        const localY = y - this._originY;

        this.coords[coordIdx + 0] = localX;
        this.coords[coordIdx + 1] = localY;

        this.updateSize();
        return 1;
    }

    addPoint(index: number, x: number, y: number): NumBool {
        if (Math.floor(index) === 0) return 0;

        const localX = x - this._originX;
        const localY = y - this._originY;

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
        if (index < 1 || coordIdx > this.coords.length) return 0;

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

    render(ctx: CanvasRenderingContext2D, sceneX: number, sceneY: number, layers: number) {
        if (this._visible === 0 || (this._layer & layers) !== 0) return;
        const offset = this.pen ? this.pen.width() || 0.5 : 0;
        const ox = this._originX - sceneX - offset;
        const oy = this._originY - sceneY - offset;
        if (!this.needRedraw) {
            ctx.drawImage(this.cnv, ox, oy);
            return;
        }
        this.cnv.width = Math.max(this._width + offset * 4, 1);
        this.cnv.height = Math.max(this._height + offset * 4, 1);
        const ctx2 = this.ctx2;
        ctx2.beginPath();
        ctx2.moveTo(this.coords[0] + offset, this.coords[1] + offset);
        for (let i = 2; i < this.coords.length; i += 2) {
            ctx2.lineTo(this.coords[i] + offset, this.coords[i + 1] + offset);
        }
        if (this.brush && this.coords.length > 4) {
            const style = this.brush.style();
            if (style !== 1) {
                ctx2.closePath();
                ctx2.fillStyle = style === 0 ? this.brush.cssColor() : (style === 3 && this.brush.dibTool()?.pattern(ctx2)) || "white";
                ctx2.fill("evenodd");
            }
        }
        if (this.pen) {
            ctx2.lineWidth = offset;
            ctx2.strokeStyle = this.pen.cssColor();
            ctx2.stroke();
        }
        this.needRedraw = false;
        ctx.drawImage(this.cnv, ox, oy);
    }

    tryClick(x: number, y: number, layers: number): this | SceneGroup | undefined {
        if (this._visible === 0 || (this._layer & layers) !== 0 || this._selectable === 0) return undefined;

        const offset = this.pen?.width() || 0;
        const ox = x - this._originX + offset;
        const oy = y - this._originY + offset;
        if (ox < 0 || oy < 0 || ox > this._width + offset * 2 || oy > this._height + offset * 2) return undefined;

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
