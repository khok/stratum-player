import { Entity } from "../entity";
import { BoundingBoxComponent } from "./boundingBoxComponent";
import { MatrixComponent } from "./matrixComponent";

export class LineComponent implements BoundingBoxComponent {
    private _coords: number[];
    private _x: number;
    private _y: number;
    private _width: number;
    private _height: number;
    private _posChanged: boolean = true;
    private _shapeChanged: boolean = true;
    private matrix: MatrixComponent;

    constructor(readonly entity: Entity, coords: number[]) {
        this.matrix = entity.matrix();
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

        this._x = minX;
        this._y = minY;
        this._width = maxX - minX;
        this._height = maxY - minY;

        // entity.on("moved", this.move.bind(this));
        // entity.on("scaled", this.scale.bind(this));
        // entity.on("rotated", this.rotate.bind(this));
    }

    /**
     * Массив координат [x1, y1, x2, y2, ...]
     */
    coords(): number[] {
        return this._coords;
    }

    /**
     * Количество точек в линии.
     */
    count(): number {
        return this._coords.length / 2;
    }

    minX(): number {
        return this._x;
    }

    minY(): number {
        return this._y;
    }

    maxX(): number {
        return this._x + this._width;
    }

    maxY(): number {
        return this._y + this._height;
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

    /**
     * Позиция точки по X.
     * @param index Индекс точки.
     */
    px(index: number): number {
        const coordIdx = index * 2;
        if (coordIdx < 0 || coordIdx >= this._coords.length) return 0;

        const realX = this._coords[coordIdx + 0] + this._x;
        const realY = this._coords[coordIdx + 1] + this._y;

        const mat = this.matrix.inv();
        const w = realX * mat[2] + realY * mat[5] + mat[8];
        return (realX * mat[0] + realY * mat[3] + mat[6]) / w;
    }

    /**
     * Позиция точки по Y.
     * @param index Индекс точки.
     */
    py(index: number): number {
        const coordIdx = index * 2;
        if (coordIdx < 0 || coordIdx >= this._coords.length) return 0;

        const realX = this._coords[coordIdx + 0] + this._x;
        const realY = this._coords[coordIdx + 1] + this._y;

        const mat = this.matrix.inv();
        const w = realX * mat[2] + realY * mat[5] + mat[8];
        return (realX * mat[1] + realY * mat[4] + mat[7]) / w;
    }

    onTransformMoved(dx: number, dy: number): void {
        this._x += dx;
        this._y += dy;
        this._posChanged = true;
    }

    onTransformScaled(ox: number, oy: number, dx: number, dy: number): void {
        for (let i = 0; i < this._coords.length; i += 2) {
            this._coords[i + 0] *= dx;
            this._coords[i + 1] *= dy;
        }

        this._x = ox + (this._x - ox) * dx;
        this._y = oy + (this._y - oy) * dy;
        this._width *= dx;
        this._height *= dy;

        this._posChanged = true;
        this._shapeChanged = true;
    }

    onTransformRotated(ox: number, oy: number, angle: number): void {
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

        this._x += minX;
        this._y += minY;
        this._width = maxX - minX;
        this._height = maxY - minY;

        this._posChanged = true;
        this._shapeChanged = true;
    }

    private recalcBBox(): void {
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

        if (minX !== 0 || minY !== 0) {
            for (let i = 0; i < this._coords.length; i += 2) {
                this._coords[i + 0] -= minX;
                this._coords[i + 1] -= minY;
            }
            this._x += minX;
            this._y += minY;
            this._posChanged = true;
        }

        this._width = maxX - minX;
        this._height = maxY - minY;
        this._shapeChanged = true;
    }

    /**
     * Добавляет точку в линию.
     * @param index Индекс точки. Если меньше нуля или больше кол-ва точек, новая точка добавляется в конец линии.
     * @param x X координата.
     * @param y Y координата.
     * @returns Была ли добавлена точка в линию?
     */
    add(index: number, x: number, y: number): boolean {
        if (index === 0) return false;

        const mat = this.matrix.data();
        const w = x * mat[2] + y * mat[5] + mat[8];
        const realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        const realY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        const localX = realX - this._x;
        const localY = realY - this._y;

        const coordIdx = index * 2;
        if (coordIdx < 0 || coordIdx >= this._coords.length) {
            this._coords.push(localX, localY);
        } else {
            this._coords.splice(coordIdx, 0, localX, localY);
        }

        this.recalcBBox();
        return true;
    }

    /**
     * Обновляет точку в линии.
     * @param index Индекс точки.
     * @param x X координата.
     * @param y Y координата.
     * @returns Была ли обновлена точка в линии?
     */
    update(index: number, x: number, y: number): boolean {
        const coordIdx = index * 2;
        if (coordIdx < 0 || coordIdx >= this._coords.length) return false;

        const mat = this.matrix.data();
        const w = x * mat[2] + y * mat[5] + mat[8];
        const realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        const realY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        const localX = realX - this._x;
        const localY = realY - this._y;

        this._coords[coordIdx + 0] = localX;
        this._coords[coordIdx + 1] = localY;

        this.recalcBBox();
        return true;
    }

    /**
     * Удаляет точку из линии.
     * @param index Индекс точки.
     * @returns Была ли удалена точка из линии?
     */
    delete(index: number): boolean {
        const coordIdx = index * 2;
        if (index < 0 || coordIdx >= this._coords.length) return false;

        this._coords.splice(coordIdx, 2);

        this.recalcBBox();
        return true;
    }

    /**
     * Позиция была изменена.
     */
    posChanged(): boolean {
        return this._posChanged;
    }

    /**
     * Массив точек был изменен.
     */
    shapeChanged(): boolean {
        return this._shapeChanged;
    }
    /**
     * Сброс после обработки компонента системой.
     */
    reset(): void {
        this._posChanged = false;
        this._shapeChanged = false;
    }
}
