import { fabric } from "fabric";
import { Point2D } from "data-types-graphics";
import { DoubleBitmapElementVisual, DoubleBitmapVisualOptions } from "scene-types";
import { DoubleBitmapToolState } from "vm-interfaces-graphics";
import { fabricConfigObjectOptions } from "../fabricConfig";

export class FabricDoubleBitmap implements DoubleBitmapElementVisual {
    private posX: number;
    private posY: number;
    obj: fabric.Image;
    constructor(
        { isVisible, position, bmpOrigin, bmpiSize, doubleBitmapTool }: DoubleBitmapVisualOptions,
        private viewRef: Point2D,
        private requestRedraw: () => void,
        private remove: (obj: fabric.Object) => void
    ) {
        this.posX = position.x;
        this.posY = position.y;
        const opts: fabric.IImageOptions = {
            ...fabricConfigObjectOptions,
            left: position.x - viewRef.x,
            top: position.y - viewRef.y,
            cropX: bmpOrigin.x,
            cropY: bmpOrigin.y,
            width: bmpiSize.x,
            height: bmpiSize.y,
            visible: isVisible
        };
        this.obj = new fabric.Image(doubleBitmapTool.image, opts);
        // this.obj = new fabric.Rect({ ...opts, width: size.x, height: size.y });
    }
    updateBitmap(bmp: DoubleBitmapToolState): void {
        throw new Error("Method not implemented.");
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
