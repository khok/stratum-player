import { Entity } from "../entity";
import { BoundingBoxComponent } from "./boundingBoxComponent";
import { HierarchyComponent } from "./hierarchyComponent";
import { MatrixComponent } from "./matrixComponent";

export class TransformComponent {
    private hier: HierarchyComponent;
    private matrix: MatrixComponent;
    private bbox: BoundingBoxComponent;
    constructor(readonly entity: Entity) {
        this.matrix = entity.matrix();
        this.hier = entity.hier();
        this.bbox = entity.bbox();
    }

    x(): number {
        const realX = this.bbox.minX();
        const realY = this.bbox.minY();

        const mat = this.matrix.inv();
        const w = realX * mat[2] + realY * mat[5] + mat[8];
        return (realX * mat[0] + realY * mat[3] + mat[6]) / w;
    }

    y(): number {
        const realX = this.bbox.minX();
        const realY = this.bbox.minY();

        const mat = this.matrix.inv();
        const w = realX * mat[2] + realY * mat[5] + mat[8];
        return (realX * mat[1] + realY * mat[4] + mat[7]) / w;
    }

    move(x: number, y: number): void {
        const mat = this.matrix.data();
        const w = x * mat[2] + y * mat[5] + mat[8];
        const realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        const realY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        this.bbox.onTransformMoved(realX - this.bbox.minX(), realY - this.bbox.minY());
        this.hier.onTransformChanged();
    }

    rotate(ox: number, oy: number, angle: number): void {
        if (angle === 0) return;

        const mat = this.matrix.data();
        const w = ox * mat[2] + oy * mat[5] + mat[8];
        const realX = (ox * mat[0] + oy * mat[3] + mat[6]) / w;
        const realY = (ox * mat[1] + oy * mat[4] + mat[7]) / w;

        this.bbox.onTransformRotated(realX, realY, angle);
        this.hier.onTransformChanged();
    }

    scale(width: number, height: number): void {
        if (width < 0 || height < 0) return;

        const bbox = this.bbox;
        const w = bbox.width();
        const h = bbox.height();
        if (w === 0 || h === 0) return;

        bbox.onTransformScaled(bbox.minX(), bbox.minY(), width / w, height / h);
        this.hier.onTransformChanged();
    }
}
