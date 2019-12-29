import { fabric } from "fabric";
import { Point2D } from "data-types-graphics";
import { LineElementVisual, LineVisualOptions } from "scene-types";
import { BrushToolState, PenToolState } from "vm-interfaces-graphics";
import { fabricConfigObjectOptions } from "../fabricConfig";

export class FabricLine implements LineElementVisual {
    private posX: number;
    private posY: number;
    obj: fabric.Polyline;
    constructor(
        { points, handle, isVisible, position, size, arrows, brush, pen }: LineVisualOptions,
        private viewRef: Point2D,
        private requestRedraw: () => void,
        private remove: (obj: fabric.Object) => void
    ) {
        this.posX = position.x;
        this.posY = position.y;
        const opts: fabric.IPolylineOptions = {
            ...fabricConfigObjectOptions,
            left: position.x - viewRef.x,
            top: position.y - viewRef.y,
            fill: brush && brush.color,
            stroke: pen && pen.color,
            strokeWidth: pen && pen.width,
            visible: isVisible
        };
        this.obj = new fabric.Polyline(points, opts);
    }
    setPoints(points: Point2D[]): void {
        throw new Error("Method not implemented.");
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
