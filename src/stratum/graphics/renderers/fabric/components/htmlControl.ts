import { InputWrapper } from "stratum/graphics/html";
import { RenderableControl, RenderableControlParams } from "stratum/graphics/scene/interfaces";
import { SceneWindow } from "stratum/graphics/sceneWindow";
import { Point2D } from "stratum/helpers/types";
import { EventCode, EventSubscriber } from "stratum/translator";

export class HtmlControl implements RenderableControl {
    readonly type = "control";
    private posX: number;
    private posY: number;
    readonly handle: number;
    private visibleArea: Point2D;
    readonly selectable: boolean;
    private inp: InputWrapper;

    constructor({ handle, isVisible, position, classname, controlSize, text }: RenderableControlParams, private viewRef: Point2D, wnd: SceneWindow) {
        if (classname !== "Edit") throw Error(`Элементы ввода типа "${classname}" пока не поддерживаются`);
        this.handle = handle;
        this.posX = position.x;
        this.posY = position.y;
        this.selectable = false;
        this.visibleArea = { ...controlSize };
        this.inp = wnd.textInput({
            x: position.x - viewRef.x,
            y: position.y - viewRef.y,
            width: controlSize.x,
            height: controlSize.y,
            hidden: !isVisible,
            text,
        });
        this.inp.onEdit(() => {
            for (const c of this.subs) c.receive(EventCode.WM_CONTROLNOTIFY, this.handle, -1, 768);
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

    private subs = new Set<EventSubscriber>();
    onChange(sub: EventSubscriber) {
        this.subs.add(sub);
    }

    offChange(sub: EventSubscriber) {
        this.subs.delete(sub);
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
