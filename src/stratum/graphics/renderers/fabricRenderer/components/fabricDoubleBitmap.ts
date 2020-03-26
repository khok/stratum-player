import { fabric } from "fabric";
import { Point2D } from "data-types-graphics";
import { DoubleBitmapElementVisual, DoubleBitmapVisualOptions } from "scene-types";
import { DoubleBitmapToolState } from "vm-interfaces-graphics";
import { fabricConfigObjectOptions } from "../fabricConfig";

export class FabricDoubleBitmap implements DoubleBitmapElementVisual {
    readonly type = "doubleBitmap";
    private posX: number;
    private posY: number;
    obj: fabric.Image;
    readonly handle: number;
    private size: Point2D;
    readonly selectable: boolean;

    //prettier-ignore
    constructor(
        { handle, isVisible, selectable, position, size, bmpOrigin, bmpSize, doubleBitmapTool }: DoubleBitmapVisualOptions,
        private viewRef: Point2D,
        private requestRedraw: () => void,
        private remove: (obj: fabric.Object) => void
    ) {
        this.handle = handle;
        this.posX = position.x;
        this.posY = position.y;
        const opts: fabric.IImageOptions = {
            ...fabricConfigObjectOptions,
            left: position.x - viewRef.x,
            top: position.y - viewRef.y,
            cropX: bmpOrigin.x,
            cropY: bmpOrigin.y,
            width: bmpSize.x || undefined,
            height: bmpSize.y || undefined,
            scaleX: bmpSize.x && size.x / bmpSize.x,
            scaleY: bmpSize.y && size.y / bmpSize.y,
            visible: isVisible
        };
        this.selectable = selectable;
        this.size = { ...size };
        this.obj = new fabric.Image(doubleBitmapTool.image, opts);
        // this.obj = new fabric.Rect({ ...opts, width: size.x, height: size.y });
    }
    testIntersect(x: number, y: number) {
        const diffX = x - this.posX;
        const diffY = y - this.posY;
        return diffX > 0 && diffX <= this.size.x && diffY > 0 && diffY <= this.size.y;
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
