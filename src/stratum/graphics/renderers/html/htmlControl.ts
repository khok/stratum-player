import { Point2D, VdrLayers } from "data-types-graphics";
import { HTMLInputElementsFactory, HtmlTextInputWrapper } from "internal-graphic-types";
import { ControlElementVisual, ControlVisualOptions } from "scene-types";
import { StratumError } from "~/helpers/errors";

export class HtmlControl implements ControlElementVisual {
    readonly type = "control";
    private posX: number;
    private posY: number;
    readonly handle: number;
    private size: Point2D;
    readonly selectable: boolean;
    private inp: HtmlTextInputWrapper;
    constructor(
        { handle, isVisible, position, classname, controlSize, text }: ControlVisualOptions,
        private viewRef: Point2D,
        factory: HTMLInputElementsFactory
    ) {
        if (classname !== "Edit") throw new StratumError(`Элементы ввода типа ${classname} пока не поддерживаются`);
        this.handle = handle;
        this.posX = position.x;
        this.posY = position.y;
        this.selectable = false;
        this.size = { ...controlSize };
        this.inp = factory.createTextInput({
            x: position.x - viewRef.x,
            y: position.y - viewRef.y,
            width: controlSize.x,
            height: controlSize.y,
            hidden: !isVisible,
            text,
        });
    }
    applyLayers(layers: VdrLayers): void {
        // throw new Error("Method not implemented.");
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

    testIntersect(x: number, y: number) {
        const diffX = x - this.posX;
        const diffY = y - this.posY;
        return diffX > 0 && diffX <= this.size.x && diffY > 0 && diffY <= this.size.y;
    }

    setPosition(x: number, y: number): void {
        const { x: viewX, y: viewY } = this.viewRef;
        this.inp.set({ x: x - viewX, y: y - viewY });
        this.posX = x;
        this.posY = y;
    }

    updateAfterViewTranslate() {
        const { posX, posY, viewRef } = this;
        this.inp.set({ x: posX - viewRef.x, y: posY - viewRef.y });
    }

    setAngle(angle: number): void {
        return;
    }
    show(): void {
        this.inp.set({ hidden: false });
    }
    hide(): void {
        this.inp.set({ hidden: true });
    }
    destroyHtml(): void {
        this.inp.destroy();
    }
}
