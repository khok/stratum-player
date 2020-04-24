import { fabric } from "fabric";
import { HTMLInputElementsFactory } from "html-types";
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
import { Point2D } from "vdr-types";
import { BrushToolState } from "vm-interfaces-gspace";
import { StratumError } from "~/helpers/errors";
import { HandleMap } from "~/helpers/handleMap";
import { colorrefToColor } from "~/helpers/varValueFunctions";
import { MessageCode } from "~/helpers/vmConstants";
import { systemKeysTemp } from "~/vm/operations/system";
import { HtmlControl } from "../html/htmlControl";
import { FabricBitmap } from "./components/fabricBitmap";
import { FabricLine } from "./components/fabricLine";
import { FabricText } from "./components/fabricText";

type VisualObject = FabricLine | FabricBitmap | FabricText | HtmlControl;

const downCodes = [MessageCode.WM_LBUTTONDOWN, MessageCode.WM_MBUTTONDOWN, MessageCode.WM_RBUTTONDOWN];
const upCodes = [MessageCode.WM_LBUTTONUP, MessageCode.WM_MBUTTONUP, MessageCode.WM_RBUTTONUP];

function convertTouch(touch: Touch, rect: DOMRect) {
    return { buttons: 1, button: 0, x: touch.clientX - rect.left, y: touch.clientY - rect.top };
}

function convertMouse(event: MouseEvent) {
    const { offsetX, offsetY, buttons, button } = event;
    const lmb = buttons & 1 ? 1 : 0;
    const rmb = buttons & 2 ? 2 : 0;
    const wheel = buttons & 4 ? 16 : 0;
    return { buttons: lmb | rmb | wheel, button, x: offsetX, y: offsetY };
}

export class FabricScene implements Scene {
    static bindEventsToCanvas(canvas: HTMLCanvasElement, scene: FabricScene) {
        canvas.oncontextmenu = (e) => e.preventDefault();

        let preventMouse = false;
        let lastTouch: Touch | undefined = undefined;
        canvas.addEventListener("touchstart", (e) => {
            preventMouse = true;
            if (e.touches.length > 1 && lastTouch) {
                scene.raiseEvent(convertTouch(lastTouch, canvas.getBoundingClientRect()), "up");
                lastTouch = undefined;
                return;
            }

            if (lastTouch !== undefined) return;

            const t = e.changedTouches[0];
            lastTouch = t;
            scene.raiseEvent(convertTouch(t, canvas.getBoundingClientRect()), "down");
        });
        canvas.addEventListener("touchend", (e) => {
            preventMouse = true;
            if (lastTouch === undefined) return;
            const t = e.changedTouches[lastTouch.identifier];
            if (!t) return;

            lastTouch = undefined;
            scene.raiseEvent(convertTouch(t, canvas.getBoundingClientRect()), "up");
        });
        canvas.addEventListener("touchmove", (e) => {
            preventMouse = true;
            if (e.touches.length < 2) e.preventDefault();

            if (lastTouch === undefined) return;
            const t = e.changedTouches[lastTouch.identifier];
            if (!t) return;

            const rect = canvas.getBoundingClientRect();
            const data = convertTouch(t, rect);
            if (data.x < 0 || data.y < 0 || data.x > rect.width || data.y > rect.height)
                scene.raiseEvent(convertTouch(lastTouch, rect), "up");
            else scene.raiseEvent(data, "move");
            lastTouch = t;
        });

        //mouse
        canvas.addEventListener("mousedown", (e) => {
            if (preventMouse) {
                preventMouse = false;
                return;
            }
            scene.raiseEvent(convertMouse(e), "down");
        });
        canvas.addEventListener("mouseup", (e) => {
            if (preventMouse) {
                preventMouse = false;
                return;
            }
            scene.raiseEvent(convertMouse(e), "up");
        });
        canvas.addEventListener("mouseleave", (e) => {
            scene.raiseEvent(convertMouse(e), "up");
        });
        canvas.addEventListener("mousemove", (e) => {
            scene.raiseEvent(convertMouse(e), "move");
        });
    }

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
        FabricScene.bindEventsToCanvas(canvas, this);
    }

    // preventMoveEvent = false;
    private raiseEvent(
        { x, y, buttons, button }: { x: number; y: number; buttons: number; button: number },
        type: "down" | "up" | "move"
    ) {
        // if (type === "move" && this.preventMoveEvent) return;
        // if (type !== "move") {
        //     this.preventMoveEvent = true;
        //     setTimeout(() => (this.preventMoveEvent = false), 50);
        // }
        const xv = x + this.view.x;
        const yv = y + this.view.y;

        switch (type) {
            case "down":
                systemKeysTemp[1] = 1;
                this.mouseSubs.forEach((s) => s(downCodes[button] || MessageCode.WM_LBUTTONDOWN, buttons, xv, yv));
                break;
            case "up":
                systemKeysTemp[1] = 0;
                this.mouseSubs.forEach((s) => s(upCodes[button] || MessageCode.WM_LBUTTONUP, 0, xv, yv));
                break;
            case "move":
                this.mouseSubs.forEach((s) => s(MessageCode.WM_MOUSEMOVE, buttons, xv, yv));
                break;
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
        const { bmpTool, color } = brush;
        if (bmpTool && bmpTool.image) this.canvas.backgroundImage = new fabric.Image(bmpTool.image);
        else this.canvas.backgroundColor = colorrefToColor(color);
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

    //Подписки на события от пользователя (клик мышью, изменение html текстбоксов)
    //
    subscribeToMouseEvents(callback: (code: MessageCode, buttons: number, x: number, y: number) => void) {
        this.mouseSubs.add(callback);
    }
    subscribeToControlEvents(callback: (code: MessageCode, controlHandle: number) => void) {
        this.controlsubs.add(callback);
    }
}
