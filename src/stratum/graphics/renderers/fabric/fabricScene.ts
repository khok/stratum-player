import { Point2D, VdrLayers } from "data-types-graphics";
import { fabric } from "fabric";
import { HTMLInputElementsFactory } from "internal-graphic-types";
import {
    BitmapElementVisual,
    BitmapVisualOptions,
    ControlElementVisual,
    ControlVisualOptions,
    LineElementVisual,
    LineVisualOptions,
    Scene,
    TextElementVisual,
    TextVisualOptions,
} from "scene-types";
import { BrushToolState } from "vm-interfaces-graphics";
import { StratumError } from "~/helpers/errors";
import { HandleMap } from "~/helpers/handleMap";
import { MessageCode } from "~/helpers/vmConstants";
import { systemKeysTemp } from "~/vm/operations/system";
import { HtmlControl } from "../html/htmlControl";
import { FabricBitmap } from "./components/fabricBitmap";
import { FabricLine } from "./components/fabricLine";
import { FabricText } from "./components/fabricText";

type VisualObject = FabricLine | FabricBitmap | FabricText | HtmlControl;

const downCodes = [MessageCode.WM_LBUTTONDOWN, MessageCode.WM_MBUTTONDOWN, MessageCode.WM_RBUTTONDOWN];
const upCodes = [MessageCode.WM_LBUTTONUP, MessageCode.WM_MBUTTONUP, MessageCode.WM_RBUTTONUP];

function convertButtons(buttons: number) {
    const lmb = buttons & 1 ? 1 : 0;
    const rmb = buttons & 2 ? 2 : 0;
    const wheel = buttons & 4 ? 16 : 0;
    return lmb | rmb | wheel;
}

export class FabricScene implements Scene {
    private canvas: fabric.StaticCanvas;
    private objects: HandleMap<VisualObject> = HandleMap.create();
    private objectsByZReversed: VisualObject[] = [];

    private view: Point2D = { x: 0, y: 0 };
    private shouldRedraw = false;

    private mouseSubs = new Set<(code: MessageCode, buttons: number, x: number, y: number) => void>();
    private controlsubs = new Set<(code: MessageCode, controlHandle: number) => void>();

    private inputFactory?: HTMLInputElementsFactory;

    constructor({ canvas, inputFactory }: { canvas: HTMLCanvasElement; inputFactory?: HTMLInputElementsFactory }) {
        this.inputFactory = inputFactory;
        this.canvas = new fabric.StaticCanvas(canvas, {
            selection: false,
            preserveObjectStacking: true,
            renderOnAddRemove: false,
        });

        //context menu
        canvas.oncontextmenu = (e) => e.preventDefault();

        //touch
        canvas.addEventListener("touchstart", (e) => {
            systemKeysTemp[1] = 1;
            this.raiseEvent({ eventType: "touch", e }, "down");
            // e.preventDefault();
        });
        canvas.addEventListener("touchend", (e) => {
            systemKeysTemp[1] = 0;
            this.raiseEvent({ eventType: "touch", e }, "up");
            // e.preventDefault();
        });
        canvas.addEventListener("touchmove", (e) => {
            this.raiseEvent({ eventType: "touch", e }, "move");
            // e.preventDefault();
        });

        //mouse
        canvas.addEventListener("mousedown", (e) => {
            systemKeysTemp[1] = 1;
            this.raiseEvent({ eventType: "mouse", e }, "down");
        });
        canvas.addEventListener("mouseup", (e) => {
            systemKeysTemp[1] = 0;
            this.raiseEvent({ eventType: "mouse", e }, "up");
        });
        canvas.addEventListener("mousemove", (e) => this.raiseEvent({ eventType: "mouse", e }, "move"));
    }

    // preventMoveEvent = false;
    private raiseEvent(
        data: { eventType: "touch"; e: TouchEvent } | { eventType: "mouse"; e: MouseEvent },
        type: "down" | "move" | "up"
    ) {
        // if (type === "move" && this.preventMoveEvent) return;
        // if (type !== "move") {
        //     this.preventMoveEvent = true;
        //     setTimeout(() => (this.preventMoveEvent = false), 50);
        // }
        const rect = this.canvas.getElement().getBoundingClientRect();

        //prettier-ignore
        const x = (data.eventType === "mouse" ? data.e.offsetX : data.e.changedTouches[0].clientX - rect.left) + this.view.x;
        const y =
            (data.eventType === "mouse" ? data.e.offsetY : data.e.changedTouches[0].clientY - rect.top) + this.view.y;
        const buttons = data.eventType === "mouse" ? convertButtons(data.e.buttons) : 1;
        switch (type) {
            case "move":
                this.mouseSubs.forEach((s) => s(MessageCode.WM_MOUSEMOVE, buttons, x, y));
                return;
            case "up": {
                const code = upCodes[data.eventType === "mouse" ? data.e.button : 0];
                if (code) this.mouseSubs.forEach((s) => s(code, buttons, x, y));
                return;
            }
            case "down": {
                const code = downCodes[data.eventType === "mouse" ? data.e.button : 0];
                if (code) this.mouseSubs.forEach((s) => s(code, buttons, x, y));
                return;
            }
        }
    }

    private requestRedraw() {
        this.shouldRedraw = true;
    }

    private assertNoObject(handle: number) {
        if (this.objects.has(handle)) throw new StratumError(`Объект #${handle} уже существует на сцене`);
    }

    //Создание объектов
    //
    createLine(data: LineVisualOptions): LineElementVisual {
        this.assertNoObject(data.handle);
        const obj = new FabricLine(data, this.view, () => this.requestRedraw());
        this.objects.set(data.handle, obj);
        return obj;
    }

    createText(data: TextVisualOptions): TextElementVisual {
        this.assertNoObject(data.handle);
        const obj = new FabricText(data, this.view, () => this.requestRedraw());
        this.objects.set(data.handle, obj);
        return obj;
    }

    createBitmap(data: BitmapVisualOptions): BitmapElementVisual {
        this.assertNoObject(data.handle);
        const obj = new FabricBitmap(data, this.view, () => this.requestRedraw());
        this.objects.set(data.handle, obj);
        return obj;
    }

    createControl(data: ControlVisualOptions): ControlElementVisual {
        if (!this.inputFactory)
            throw new StratumError("Попытка создать элемент управления без фабрики элементов ввода");
        this.assertNoObject(data.handle);
        const obj = new HtmlControl(data, this.view, this.inputFactory);
        obj.onChange(() => {
            this.controlsubs.forEach((c) => c(MessageCode.WM_CONTROLNOTIFY, data.handle));
            this.requestRedraw();
        });
        this.objects.set(data.handle, obj);
        return obj;
    }

    updateBrush(brush: BrushToolState) {
        this.canvas.backgroundColor = brush.color;
    }

    applyLayers(layers: VdrLayers): void {
        for (const obj of this.objects.values()) obj.applyLayers(layers);
    }

    //Управление порядком отображения объектов.
    //
    placeObjects(order: number[]): void {
        this.objectsByZReversed.forEach((c) => {
            if (c.type !== "control") this.canvas.remove(c.obj);
        });
        const objsByZ = [];
        for (const handle of order) {
            const obj = this.objects.get(handle);
            if (!obj) throw new StratumError(`Объект #${handle} не найден на сцене`);
            if (obj.type !== "control") this.canvas.add(obj.obj);
            objsByZ.push(obj);
        }
        this.objectsByZReversed = objsByZ.reverse();
        this.requestRedraw();
    }

    appendObjectToEnd(obj: VisualObject) {
        if (obj.type !== "control") this.canvas.add(obj.obj);
        this.objectsByZReversed = [obj].concat(this.objectsByZReversed);
        this.requestRedraw();
    }

    moveObjectToTop(obj: VisualObject) {
        if (obj.type !== "control") obj.obj.bringToFront();
        const obzr = this.objectsByZReversed;
        this.objectsByZReversed = [obj].concat(obzr.filter((o) => o !== obj));
        this.requestRedraw();
    }

    removeObject(obj: VisualObject) {
        if (obj.type === "control") obj.destroyHtml();
        else this.canvas.remove(obj.obj);
        this.objects.delete(obj.handle);
        this.objectsByZReversed = this.objectsByZReversed.filter((o) => o !== obj);
        this.requestRedraw();
    }

    //Изменение точки обзора, размеров сцены.
    //
    translateView(x: number, y: number): void {
        this.view.x = x;
        this.view.y = y;
        for (const obj of this.objects.values()) obj.updateAfterViewTranslate();
        this.requestRedraw();
    }

    adaptToNewSize(width: number, height: number): void {
        this.canvas.setWidth(width).setHeight(height).calcOffset();
    }

    //Визуальные проверки.
    //
    testVisualIntersection(visualHandle: number, x: number, y: number): boolean {
        const vs = this.objects.get(visualHandle);
        return vs ? vs.testIntersect(x, y) : false;
    }

    getVisualHandleFromPoint(x: number, y: number): number {
        for (const obj of this.objectsByZReversed) {
            if (obj.selectable && obj.testIntersect(x, y)) {
                const res = obj.type !== "control" ? obj.handle : 0;
                return res;
            }
        }
        return 0;
    }

    //Запуск отрисовки.
    //
    render(): boolean {
        if (!this.shouldRedraw) return false;
        this.shouldRedraw = false;
        this.canvas.renderAll();
        return true;
    }

    forceRender() {
        this.canvas.renderAll();
        this.shouldRedraw = false;
    }

    //Подписки на события от пользователя (клик мышью, изменение html текстбоксов)
    //
    subscribeToMouseEvents(callback: (code: MessageCode, buttons: number, x: number, y: number) => void) {
        this.mouseSubs.add(callback);
    }
    subscribeToControlEvents(callback: (code: MessageCode, controlHandle: number) => void) {
        this.controlsubs.add(callback);
    }
}
