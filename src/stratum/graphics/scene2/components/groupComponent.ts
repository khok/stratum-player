import { Entity } from "../entity";
import { BoundingBoxComponent } from "./boundingBoxComponent";
import { HierarchyComponent } from "./hierarchyComponent";

export class GroupComponent implements BoundingBoxComponent {
    private _minX: number = 0;
    private _maxX: number = 0;
    private _minY: number = 0;
    private _maxY: number = 0;
    private _children = new Set<BoundingBoxComponent>();
    private hier: HierarchyComponent;
    constructor(readonly entity: Entity) {
        this.hier = this.entity.hier();
    }

    children(): Set<BoundingBoxComponent> {
        return this._children;
    }

    minX(): number {
        return this._minX;
    }
    minY(): number {
        return this._minY;
    }
    maxX(): number {
        return this._maxX;
    }
    maxY(): number {
        return this._maxY;
    }
    width(): number {
        return this._maxX - this._minX;
    }
    actualWidth(): number {
        return this._maxX - this._minX;
    }
    height(): number {
        return this._maxY - this._minY;
    }
    actualHeight(): number {
        return this._maxY - this._minY;
    }
    onTransformMoved(dx: number, dy: number): void {
        if (this._children.size === 0) return;
        this._children.forEach((c) => c.onTransformMoved(dx, dy));
        this._minX += dx;
        this._minY += dy;
        this._maxX += dx;
        this._maxY += dy;
    }
    onTransformScaled(ox: number, oy: number, dx: number, dy: number): void {
        if (this._children.size === 0) return;
        this._minX = Infinity;
        this._maxX = -Infinity;
        this._minY = Infinity;
        this._maxY = -Infinity;

        this._children.forEach((c) => {
            c.onTransformScaled(ox, oy, dx, dy);
            this._minX = Math.min(this._minX, c.minX());
            this._minY = Math.min(this._minY, c.minY());
            this._maxX = Math.max(this._maxX, c.maxX());
            this._maxY = Math.max(this._maxY, c.maxY());
        });
    }
    onTransformRotated(ox: number, oy: number, angle: number): void {
        if (this._children.size === 0) return;
        this._minX = Infinity;
        this._maxX = -Infinity;
        this._minY = Infinity;
        this._maxY = -Infinity;
        this._children.forEach((c) => {
            c.onTransformRotated(ox, oy, angle);
            this._minX = Math.min(this._minX, c.minX());
            this._minY = Math.min(this._minY, c.minY());
            this._maxX = Math.max(this._maxX, c.maxX());
            this._maxY = Math.max(this._maxY, c.maxY());
        });
    }

    recalcBorders(): void {
        if (this._children.size === 0) return;
        this._minX = Infinity;
        this._maxX = -Infinity;
        this._minY = Infinity;
        this._maxY = -Infinity;
        this._children.forEach((c) => {
            this._minX = Math.min(this._minX, c.minX());
            this._minY = Math.min(this._minY, c.minY());
            this._maxX = Math.max(this._maxX, c.maxX());
            this._maxY = Math.max(this._maxY, c.maxY());
        });
        this.hier.onTransformChanged();
    }
}
