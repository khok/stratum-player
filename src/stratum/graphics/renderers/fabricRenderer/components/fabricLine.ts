import { fabric } from "fabric";
import { Point2D } from "data-types-graphics";
import { LineElementVisual, LineVisualOptions } from "scene-types";
import { BrushToolState, PenToolState } from "vm-interfaces-graphics";
import { fabricConfigObjectOptions } from "../fabricConfig";

export class FabricLine implements LineElementVisual {
    readonly type = "line";
    private posX: number;
    private posY: number;
    obj: fabric.Polyline;
    readonly handle: number;
    private size: Point2D;
    readonly selectable: boolean;

    constructor(
        { handle, points, isVisible, selectable, position, brush, pen }: LineVisualOptions,
        private viewRef: Point2D,
        private requestRedraw: () => void,
        private remove: (obj: fabric.Object) => void
    ) {
        this.handle = handle;
        this.posX = position.x;
        this.posY = position.y;
        const opts: fabric.IPolylineOptions = {
            ...fabricConfigObjectOptions,
            left: position.x - viewRef.x,
            top: position.y - viewRef.y,
            fill: brush && brush.color,
            stroke: pen && pen.color,
            strokeWidth: pen ? pen.width || 0.5 : 0,
            visible: isVisible
        };
        const sizes = points.reduce(
            (a, c) => ({
                minX: Math.min(a.minX, c.x),
                maxX: Math.max(a.maxX, c.x),
                minY: Math.min(a.minY, c.y),
                maxY: Math.max(a.maxY, c.y)
            }),
            { minX: 0, maxX: 0, minY: 0, maxY: 0 }
        );
        this.selectable = selectable;
        this.size = { x: sizes.maxX - sizes.minX, y: sizes.maxX - sizes.minY };
        this.obj = new fabric.Polyline(points, opts);
    }
    setPoints(points: Point2D[]): void {
        throw new Error("Method not implemented.");
    }

    testIntersect(x: number, y: number) {
        const diffX = x - this.posX;
        const diffY = y - this.posY;
        return diffX > 0 && diffX <= this.size.x && diffY > 0 && diffY <= this.size.y;
    }

    updatePen(pen: PenToolState): void {
        this.obj.set({ strokeWidth: pen.width, stroke: pen.color });
        this.requestRedraw();
    }
    updateBrush(brush: BrushToolState): void {
        this.obj.fill = brush.color;
        this.requestRedraw();
    }
    setPosition(x: number, y: number): void {
        const { x: viewX, y: viewY } = this.viewRef;
        this.obj.set({ left: x - viewX, top: y - viewY }).setCoords();
        this.posX = x;
        this.posY = y;
        this.requestRedraw();
    }
    updateAfterViewTranslate() {
        const { posX, posY, viewRef } = this;
        this.obj.set({ left: posX - viewRef.x, top: posY - viewRef.y }).setCoords();
    }
    setAngle(angle: number): void {
        this.obj.set({ angle }).setCoords();
        this.requestRedraw();
    }
    show(): void {
        this.obj.visible = true;
        this.requestRedraw();
    }
    hide(): void {
        this.obj.visible = false;
        this.requestRedraw();
    }
    destroy(): void {
        this.remove(this.obj);
    }
}
