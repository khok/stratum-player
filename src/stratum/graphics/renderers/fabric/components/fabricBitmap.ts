import { fabric } from "fabric";
import { Point2D, VdrLayers } from "data-types-graphics";
import { BitmapElementVisual, BitmapVisualOptions } from "scene-types";
import { BitmapToolState } from "vm-interfaces-graphics";
import { fabricConfigObjectOptions } from "../fabricConfig";

export class FabricBitmap implements BitmapElementVisual {
    readonly type = "bitmap";
    private posX: number;
    private posY: number;
    obj: fabric.Image;
    readonly handle: number;
    private size: Point2D;
    readonly selectable: boolean;

    constructor(
        { handle, isVisible, selectable, position, size, bmpOrigin, bmpSize, bitmapTool }: BitmapVisualOptions,
        private viewRef: Point2D,
        private requestRedraw: () => void
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
            width: bmpSize.x,
            height: bmpSize.y,
            scaleX: bmpSize.x ? size.x / bmpSize.x : 1,
            scaleY: bmpSize.y ? size.y / bmpSize.y : 1,
            visible: isVisible,
        };
        this.selectable = selectable;
        this.size = { ...size };
        this.obj = new fabric.Image(bitmapTool.image, opts);
    }
    applyLayers(layers: VdrLayers): void {
        // throw new Error("Method not implemented.");
    }
    setRect(x: number, y: number, width: number, height: number): void {
        this.obj.set({ cropX: x, cropY: y, width, height });
        this.requestRedraw();
    }
    testIntersect(x: number, y: number) {
        const diffX = x - this.posX;
        const diffY = y - this.posY;
        return diffX > 0 && diffX <= this.size.x && diffY > 0 && diffY <= this.size.y;
    }
    updateBitmap(bmp: BitmapToolState): void {
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
}
