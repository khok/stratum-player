import { fabric } from "fabric";
import { Point2D, VdrLayers } from "data-types-graphics";
import { BitmapElementVisual, BitmapVisualOptions } from "scene-types";
import { BitmapToolState } from "vm-interfaces-gspace";
import { fabricConfigObjectOptions } from "../fabricConfig";

export class FabricBitmap implements BitmapElementVisual {
    readonly type = "bitmap";
    private posX: number;
    private posY: number;
    obj: fabric.Image;
    readonly handle: number;
    private visibleArea: Point2D;
    readonly selectable: boolean;
    private visible: boolean;
    private imageLoaded: boolean;

    constructor(
        { handle, isVisible, selectable, position, scale, bmpOrigin, bmpSize, bmpTool }: BitmapVisualOptions,
        private viewRef: Point2D,
        private requestRedraw: () => void
    ) {
        this.handle = handle;
        this.posX = position.x;
        this.posY = position.y;
        this.visible = isVisible;
        this.imageLoaded = !!bmpTool.image;
        const opts: fabric.IImageOptions = {
            ...fabricConfigObjectOptions,
            left: position.x - viewRef.x,
            top: position.y - viewRef.y,
            cropX: bmpOrigin && bmpOrigin.x,
            cropY: bmpOrigin && bmpOrigin.y,
            width: bmpSize.x,
            height: bmpSize.y,
            scaleX: scale ? scale.x : 1,
            scaleY: scale ? scale.y : 1,
            visible: isVisible && this.imageLoaded,
        };
        this.selectable = selectable;
        this.obj = new fabric.Image(bmpTool.image, opts);
        this.visibleArea = { x: this.obj.width || 0, y: this.obj.height || 0 };
    }

    getVisibleAreaSize(): Point2D {
        return this.visibleArea;
    }

    updateAfterViewTranslate() {
        const { posX, posY, viewRef } = this;
        this.obj.set({ left: posX - viewRef.x, top: posY - viewRef.y }).setCoords();
    }

    setPosition(x: number, y: number): void {
        const { x: viewX, y: viewY } = this.viewRef;
        this.obj.set({ left: x - viewX, top: y - viewY }).setCoords();
        this.posX = x;
        this.posY = y;
        this.requestRedraw();
    }

    scaleTo(width: number, height: number): void {
        this.visibleArea = { x: width, y: height };
        this.obj.set({ scaleX: width / this.obj.width!, scaleY: height / this.obj.height! }).setCoords();
        // this.obj.scaleToWidth(width);
        // this.obj.scaleToHeight(height);
        this.requestRedraw();
    }

    setAngle(angle: number): void {
        this.obj.set({ angle }).setCoords();
        this.requestRedraw();
    }

    testIntersect(x: number, y: number) {
        const diffX = x - this.posX;
        const diffY = y - this.posY;
        return diffX > 0 && diffX <= this.visibleArea.x && diffY > 0 && diffY <= this.visibleArea.y;
    }

    applyLayers(layers: VdrLayers): void {
        // throw new Error("Method not implemented.");
    }

    show(): void {
        this.obj.set({ visible: this.imageLoaded });
        this.visible = true;
        this.requestRedraw();
    }

    hide(): void {
        this.obj.set({ visible: false });
        this.visible = false;
        this.requestRedraw();
    }

    updateBitmap(bmp: BitmapToolState): void {
        this.imageLoaded = !!bmp.image;
        const { cropX, cropY, width, height, scaleX, scaleY } = this.obj;
        const visible = this.visible && this.imageLoaded;
        this.obj.setElement(bmp.image!).set({ cropX, cropY, width, height, scaleX, scaleY, visible }).setCoords();
        this.requestRedraw();
    }

    setRect(x: number, y: number, width: number, height: number): void {
        this.obj.set({ cropX: x, cropY: y, width, height });
        this.requestRedraw();
    }
}
