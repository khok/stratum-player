import { ToolKeeperComponent } from "../components/toolKeeperComponent";
import { VisibilityComponent } from "../components/visibilityComponent";
import { Scene } from "../scene";
import { BrushTool } from "../tools/brushTool";
import { PenTool } from "../tools/penTool";
import { Element2D, Element2DArgs } from "./element2d";

export interface LineElement2DArgs extends Element2DArgs {
    visible?: boolean;
    layer?: number;
    pen?: PenTool;
    brush?: BrushTool;
}

export class LineElement2D extends Element2D {
    readonly type = "line";
    _coords: number[];
    _shapeVer: number = 0;

    readonly visib: VisibilityComponent;
    readonly pen: ToolKeeperComponent<PenTool>;
    readonly brush: ToolKeeperComponent<BrushTool>;

    constructor(scene: Scene, coords: readonly number[], args: LineElement2DArgs = {}) {
        super(scene, args);
        if (coords.length < 2) throw Error("Линия не имеет точек");

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

        this._coords = coords.slice();
        for (let i = 0; i < coords.length; i += 2) {
            this._coords[i + 0] -= minX;
            this._coords[i + 1] -= minY;
        }

        const width = maxX - minX;
        const height = maxY - minY;
        this._updateBBox(minX, minY, width, height);
        this._parent?._recalcBorders();

        this.visib = new VisibilityComponent(this, args.visible ?? true, args.layer ?? 0);
        this.pen = new ToolKeeperComponent(scene, args.pen);
        this.brush = new ToolKeeperComponent(scene, args.brush);
    }

    // copy(scene: Scene, attribs: number): SceneLine {
    //     const brushHandle = this.brush?.copy(scene).handle ?? 0;
    //     const penHandle = this.pen?.copy(scene).handle ?? 0;

    //     const coords = this.coords.slice();
    //     for (let i = 0; i < coords.length; i += 2) {
    //         coords[i + 0] += this._x;
    //         coords[i + 1] += this._y;
    //     }

    //     const handle = HandleMap.getFreeHandle(scene.objects);
    //     const copy = new SceneLine(scene, {
    //         handle,
    //         name: this.name,
    //         coords,
    //         brushHandle,
    //         penHandle,
    //     });

    //     copy.hyperbase = this.hyperbase;
    //     copy._selectable = this._selectable;
    //     copy._layer = this._layer;
    //     copy._visible = this._visible;

    //     scene.objects.set(handle, copy);
    //     scene.primaryObjects.push(copy);
    //     return copy;
    // }

    px(index: number): number {
        const coordIdx = index * 2;
        if (coordIdx < 0 || coordIdx >= this._coords.length) return 0;

        return this._coords[coordIdx + 0] + this._x;

        // const canvasX = this._coords[coordIdx + 0] + this._x;
        // const canvasY = this._coords[coordIdx + 1] + this._y;

        // const mat = this.scene._invMatrix;
        // const w = canvasX * mat[2] + canvasY * mat[5] + mat[8];
        // return (canvasX * mat[0] + canvasY * mat[3] + mat[6]) / w;
    }

    py(index: number): number {
        const coordIdx = index * 2;
        if (coordIdx < 0 || coordIdx >= this._coords.length) return 0;

        return this._coords[coordIdx + 1] + this._y;
        // const canvasX = this._coords[coordIdx + 0] + this._x;
        // const canvasY = this._coords[coordIdx + 1] + this._y;

        // const mat = this.scene._invMatrix;
        // const w = canvasX * mat[2] + canvasY * mat[5] + mat[8];
        // return (canvasX * mat[1] + canvasY * mat[4] + mat[7]) / w;
    }

    private pointsChanged() {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (let i = 0; i < this._coords.length; i += 2) {
            const x = this._coords[i + 0];
            const y = this._coords[i + 1];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }

        let x = this._x;
        let y = this._y;

        if (minX !== 0 || minY !== 0) {
            for (let i = 0; i < this._coords.length; i += 2) {
                this._coords[i + 0] -= minX;
                this._coords[i + 1] -= minY;
            }
            x += minX;
            y += minY;
        }

        const width = maxX - minX;
        const height = maxY - minY;

        ++this._shapeVer;
        this._updateBBox(x, y, width, height);
        this._parent?._recalcBorders();
    }

    add(index: number, x: number, y: number): boolean {
        if (index === 0) return false;

        // const mat = this.scene._matrix;
        // const w = x * mat[2] + y * mat[5] + mat[8];
        // const canvasX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        // const canvasY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        // const localX = canvasX - this._x;
        // const localY = canvasY - this._y;

        const localX = x - this._x;
        const localY = y - this._y;

        const coordIdx = index * 2;
        if (coordIdx < 0 || coordIdx >= this._coords.length) {
            this._coords.push(localX, localY);
        } else {
            this._coords.splice(coordIdx, 0, localX, localY);
        }
        this.pointsChanged();
        return true;
    }

    update(index: number, x: number, y: number): boolean {
        const coordIdx = index * 2;
        if (coordIdx < 0 || coordIdx >= this._coords.length) return false;

        // const mat = this.scene._matrix;
        // const w = x * mat[2] + y * mat[5] + mat[8];
        // const canvasX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        // const canvasY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        // const localX = canvasX - this._x;
        // const localY = canvasY - this._y;

        const localX = x - this._x;
        const localY = y - this._y;

        this._coords[coordIdx + 0] = localX;
        this._coords[coordIdx + 1] = localY;
        this.pointsChanged();
        return true;
    }

    delete(index: number): boolean {
        const coordIdx = index * 2;
        if (coordIdx < 0 || coordIdx >= this._coords.length) return false;

        this._coords.splice(coordIdx, 2);
        this.pointsChanged();
        return true;
    }

    pointCount(): number {
        return this._coords.length / 2;
    }

    override _resized(ox: number, oy: number, dx: number, dy: number): void {
        for (let i = 0; i < this._coords.length; i += 2) {
            this._coords[i + 0] *= dx;
            this._coords[i + 1] *= dy;
        }
        ++this._shapeVer;
        super._resized(ox, oy, dx, dy);
    }

    override _rotated(ox: number, oy: number, angle: number): void {
        const s = Math.sin(angle);
        const c = Math.cos(angle);

        const cx = ox - this._x;
        const cy = oy - this._y;

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (let i = 0; i < this._coords.length; i += 2) {
            // translate point back to origin:
            const px = this._coords[i + 0] - cx;
            const py = this._coords[i + 1] - cy;

            // rotate point & translate point back:
            const xnew = px * c - py * s + cx;
            const ynew = px * s + py * c + cy;

            this._coords[i + 0] = xnew;
            this._coords[i + 1] = ynew;
            if (xnew < minX) minX = xnew;
            if (xnew > maxX) maxX = xnew;
            if (ynew < minY) minY = ynew;
            if (ynew > maxY) maxY = ynew;
        }

        for (let i = 0; i < this._coords.length; i += 2) {
            this._coords[i + 0] -= minX;
            this._coords[i + 1] -= minY;
        }

        const x = this._x + minX;
        const y = this._y + minY;
        const width = maxX - minX;
        const height = maxY - minY;

        ++this._shapeVer;
        this._updateBBox(x, y, width, height);
    }
}
