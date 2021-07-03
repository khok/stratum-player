import { Scene } from "../scene";
import { GroupElement2D } from "./groupElement2d";

export interface Element2DArgs {
    handle?: number;
    name?: string;
    meta?: Object | null;
}

export class Element2D {
    handle: number;
    name: string;

    _x: number = 0;
    _y: number = 0;
    _width: number = 0;
    _height: number = 0;
    _parent: GroupElement2D | null = null;
    _meta: Object | null;

    constructor(readonly scene: Scene, args: Element2DArgs) {
        this.handle = args.handle ?? 0;
        this.name = args.name ?? "";
        this._meta = args.meta ?? null;
    }

    _moved(dx: number, dy: number): void {
        this._updateBBox(this._x + dx, this._y + dy, this._width, this._height);
    }

    _rotated(ox: number, oy: number, angle: number): void {
        const s = Math.sin(angle);
        const c = Math.cos(angle);

        // translate point back to origin:
        const posx = this._x - ox;
        const posy = this._y - oy;

        // rotate point
        const xnew = posx * c - posy * s;
        const ynew = posx * s + posy * c;

        // translate point back:
        const x = xnew + ox;
        const y = ynew + oy;
        this._updateBBox(x, y, this._width, this._height);
    }

    _resized(ox: number, oy: number, dx: number, dy: number): void {
        const x = ox + (this._x - ox) * dx;
        const y = oy + (this._y - oy) * dy;
        const width = this._width * dx;
        const height = this._height * dy;
        this._updateBBox(x, y, width, height);
    }

    x(): number {
        // const mat = this.scene._invMatrix;
        // const w = this._x * mat[2] + this._y * mat[5] + mat[8];
        // return (this._x * mat[0] + this._y * mat[3] + mat[6]) / w;
        return this._x;
    }

    y(): number {
        // const mat = this.scene._invMatrix;
        // const w = this._x * mat[2] + this._y * mat[5] + mat[8];
        // return (this._x * mat[1] + this._y * mat[4] + mat[7]) / w;
        return this._y;
    }

    width(): number {
        return this._width;
    }

    height(): number {
        return this._height;
    }

    move(x: number, y: number): this {
        // const mat = this.scene._matrix;
        // const w = x * mat[2] + y * mat[5] + mat[8];
        // const canvasX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        // const canvasY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        // this._moved(canvasX - this._x, canvasY - this._y);
        this._moved(x - this._x, y - this._y);
        this._parent?._recalcBorders();
        this.scene._dirty = true;
        return this;
    }

    rotate(ox: number, oy: number, angle: number): this {
        if (angle === 0) return this;

        // const mat = this.scene._matrix;
        // const w = ox * mat[2] + oy * mat[5] + mat[8];
        // const canvasX = (ox * mat[0] + oy * mat[3] + mat[6]) / w;
        // const canvasY = (ox * mat[1] + oy * mat[4] + mat[7]) / w;

        // this._rotated(canvasX, canvasY, angle);
        this._rotated(ox, oy, angle);
        this._parent?._recalcBorders();
        this.scene._dirty = true;
        return this;
    }

    size(w: number, h: number): this {
        if (w < 0 || h < 0) return this;

        const cw = this._width;
        const ch = this._height;
        if (cw === 0 || ch === 0) return this;

        this._resized(this._x, this._y, w / cw, h / ch);
        this._parent?._recalcBorders();
        this.scene._dirty = true;
        return this;
    }

    protected _updateBBox(x: number, y: number, width: number, height: number) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        this.scene._dirty = true;
    }

    parent(): GroupElement2D | null {
        return this._parent;
    }
}
