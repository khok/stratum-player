import { Point2D } from "data-types-graphics";
import { fabric } from "fabric";
import { ControlElementVisual, ControlVisualOptions } from "scene-types";
import { StratumError } from "~/helpers/errors";
import { fabricConfigObjectOptions } from "../fabricConfig";

export class FabricControl implements ControlElementVisual {
    readonly type = "control";
    private posX: number;
    private posY: number;
    private _text: string;
    private textObj: fabric.Text;
    private rectObj: fabric.Rect;
    obj: fabric.Group;
    readonly handle: number;
    private size: Point2D;
    readonly selectable: boolean;
    constructor(
        { handle, isVisible, selectable, position, classname, controlSize, text }: ControlVisualOptions,
        private viewRef: Point2D,
        private requestRedraw: () => void,
        private remove: (obj: fabric.Object) => void
    ) {
        if (classname !== "Edit") throw new StratumError(`Элементы ввода типа ${classname} пока не поддерживаются`);
        this.handle = handle;
        this.posX = position.x;
        this.posY = position.y;
        this.selectable = selectable;
        this.size = { ...controlSize };
        const opts: fabric.IGroupOptions = {
            ...fabricConfigObjectOptions,
            left: position.x - viewRef.x,
            top: position.y - viewRef.y,
            visible: isVisible,
        };
        this.rectObj = new fabric.Rect({
            top: -6,
            width: controlSize.x,
            height: controlSize.y - 1,
            fill: "white",
            stroke: "gray",
            strokeWidth: 1,
        });
        this.textObj = new fabric.Text("", {
            fontSize: controlSize.y - 3,
            top: -6,
            left: 2,
        });
        this._text = text;
        this.setText(text);

        this.obj = new fabric.Group([this.rectObj, this.textObj], opts);
    }
    setText(text: string): void {
        // console.log(text);
        this._text = text;
        // this.textObj.setSelectionStyles({ fontSize: this.textObj.fontSize, fill: "red" }, 0, 2);

        let realLine = "";
        for (let i = 0; i < text.length; i++) {
            this.textObj.set({ text: realLine + text[i] });
            if (this.textObj.measureLine(0).width >= this.size.x) break;
            realLine += text[i];
        }
        this.textObj.set({ text: realLine });
        this.textObj.setCoords();
        this.requestRedraw();
    }

    getText(): string {
        return this._text;
    }

    testIntersect(x: number, y: number) {
        const diffX = x - this.posX;
        const diffY = y - this.posY;
        return diffX > 0 && diffX <= this.size.x && diffY > 0 && diffY <= this.size.y;
    }

    focus() {
        // console.log(this.handle, " focused");
        this.rectObj.set({ strokeWidth: 2 }).setCoords();
        this.requestRedraw();
    }
    blur() {
        // console.log(this.handle, " blured");
        this.rectObj.set({ strokeWidth: 1 }).setCoords();
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
