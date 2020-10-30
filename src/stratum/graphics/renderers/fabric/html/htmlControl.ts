import { RenderableControl, RenderableControlParams } from "stratum/graphics/scene/interfaces";
import { NotImplementedError } from "stratum/helpers/errors";
import { Point2D } from "stratum/helpers/types";
import { HtmlElementsFactory, HtmlInputWrapper } from "./htmlFactory";

export class HtmlControl implements RenderableControl {
    readonly type = "control";
    private posX: number;
    private posY: number;
    readonly handle: number;
    private visibleArea: Point2D;
    readonly selectable: boolean;
    private inp: HtmlInputWrapper;

    constructor(
        { handle, isVisible, position, classname, controlSize, text }: RenderableControlParams,
        private viewRef: Point2D,
        factory: HtmlElementsFactory
    ) {
        if (classname !== "Edit") throw new NotImplementedError(`Элементы ввода типа ${classname} пока не поддерживаются`);
        this.handle = handle;
        this.posX = position.x;
        this.posY = position.y;
        this.selectable = false;
        this.visibleArea = { ...controlSize };
        this.inp = factory.createTextInput({
            x: position.x - viewRef.x,
            y: position.y - viewRef.y,
            width: controlSize.x,
            height: controlSize.y,
            hidden: !isVisible,
            text,
        });
    }

    getVisibleAreaSize(): Point2D {
        return this.visibleArea;
    }

    updateAfterViewTranslate() {
        const { posX, posY, viewRef } = this;
        this.inp.set({ x: posX - viewRef.x, y: posY - viewRef.y });
    }

    setPosition(x: number, y: number): void {
        const { x: viewX, y: viewY } = this.viewRef;
        this.inp.set({ x: x - viewX, y: y - viewY });
        this.posX = x;
        this.posY = y;
    }

    scaleTo(width: number, height: number): void {
        // throw new Error("Method not implemented.");
    }

    setAngle(angle: number): void {}

    testIntersect(x: number, y: number) {
        const diffX = x - this.posX;
        const diffY = y - this.posY;
        return diffX > 0 && diffX <= this.visibleArea.x && diffY > 0 && diffY <= this.visibleArea.y;
    }

    show(): void {
        this.inp.set({ hidden: false });
    }

    hide(): void {
        this.inp.set({ hidden: true });
    }

    onChange(fn: () => void) {
        this.inp.onChange(fn);
    }

    setText(text: string): void {
        this.inp.set({ text });
    }

    getText(): string {
        return this.inp.text;
    }

    destroyHtml(): void {
        this.inp.destroy();
    }
}
