import { Scene } from "../scene";
import { Element2D, Element2DArgs } from "./element2d";

export interface GroupElement2DArgs extends Element2DArgs {
    children?: readonly Element2D[];
}

export class GroupElement2D extends Element2D {
    readonly type = "group";
    _children: readonly Element2D[] = [];

    constructor(scene: Scene, args: GroupElement2DArgs = {}) {
        super(scene, args);
        if (args.children) {
            this.setChildren(args.children);
        }
    }

    children(): readonly Element2D[] {
        return this._children;
    }

    override _moved(dx: number, dy: number): void {
        if (this._children.length === 0) return;
        this._children.forEach((c) => c._moved(dx, dy));
        this._updateBBox(this._x + dx, this._y + dy, this._width, this._height);
    }

    override _resized(ox: number, oy: number, dx: number, dy: number): void {
        if (this._children.length === 0) return;
        let _minX = Infinity;
        let _maxX = -Infinity;
        let _minY = Infinity;
        let _maxY = -Infinity;
        this._children.forEach((c) => {
            c._resized(ox, oy, dx, dy);
            _minX = Math.min(_minX, c._x);
            _minY = Math.min(_minY, c._y);
            _maxX = Math.max(_maxX, c._x + c._width);
            _maxY = Math.max(_maxY, c._y + c._height);
        });
        this._updateBBox(_minX, _minY, _maxX - _minX, _maxY - _minY);
    }

    override _rotated(ox: number, oy: number, angle: number): void {
        if (this._children.length === 0) return;
        let _minX = Infinity;
        let _maxX = -Infinity;
        let _minY = Infinity;
        let _maxY = -Infinity;
        this._children.forEach((c) => {
            c._rotated(ox, oy, angle);
            _minX = Math.min(_minX, c._x);
            _minY = Math.min(_minY, c._y);
            _maxX = Math.max(_maxX, c._x + c._width);
            _maxY = Math.max(_maxY, c._y + c._height);
        });
        this._updateBBox(_minX, _minY, _maxX - _minX, _maxY - _minY);
    }

    setChildren(children: readonly Element2D[]): this {
        this._children.forEach((c) => (c._parent = null));
        if (children.length === 0) return this;

        let _minX = Infinity;
        let _maxX = -Infinity;
        let _minY = Infinity;
        let _maxY = -Infinity;
        children.forEach((c) => {
            c._parent = this;
            _minX = Math.min(_minX, c._x);
            _minY = Math.min(_minY, c._y);
            _maxX = Math.max(_maxX, c._x + c._width);
            _maxY = Math.max(_maxY, c._y + c._height);
        });
        this._children = children;
        this._updateBBox(_minX, _minY, _maxX - _minX, _maxY - _minY);
        this._parent?._recalcBorders();
        return this;
    }

    _recalcBorders(): void {
        let _minX = Infinity;
        let _maxX = -Infinity;
        let _minY = Infinity;
        let _maxY = -Infinity;
        this._children.forEach((c) => {
            _minX = Math.min(_minX, c._x);
            _minY = Math.min(_minY, c._y);
            _maxX = Math.max(_maxX, c._x + c._width);
            _maxY = Math.max(_maxY, c._y + c._height);
        });
        this._updateBBox(_minX, _minY, _maxX - _minX, _maxY - _minY);
        this._parent?._recalcBorders();
    }
}
