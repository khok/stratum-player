import { Point2D } from "data-types-graphics";
import { fabric } from "fabric";
import { TextElementVisual, TextVisualOptions } from "scene-types";
import { TextToolState } from "vm-interfaces-graphics";
import { fabricConfigObjectOptions } from "../fabricConfig";

const textScaleCoof = 0.7;

export class FabricText implements TextElementVisual {
    private posX: number;
    private posY: number;
    obj: fabric.Text;
    readonly handle: number;
    private size: Point2D;
    readonly selectable: boolean;

    constructor(
        { handle, isVisible, selectable, position, text: textTool }: TextVisualOptions,
        private viewRef: Point2D,
        private requestRedraw: () => void,
        private remove: (obj: fabric.Object) => void
    ) {
        this.handle = handle;
        this.posX = position.x;
        this.posY = position.y;
        const { text, size: textSize } = textTool.assembledText;
        const opts: fabric.ITextOptions = {
            ...fabricConfigObjectOptions,
            left: position.x - viewRef.x,
            top: position.y - viewRef.y,
            visible: isVisible,
            fontSize: textSize * textScaleCoof
        };
        this.selectable = false; // selectable;
        this.size = { x: 0, y: 0 };
        this.obj = new fabric.Text(text, opts);
    }

    testIntersect(x: number, y: number) {
        return false;
        const diffX = x - this.posX;
        const diffY = y - this.posY;
        return diffX > 0 && diffX <= this.size.x && diffY > 0 && diffY <= this.size.y;
    }

    updateText(textTool: TextToolState): void {
        const { text, size } = textTool.assembledText;
        this.obj.set({ text, fontSize: size * textScaleCoof });
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
