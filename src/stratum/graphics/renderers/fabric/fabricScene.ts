import { fabric } from "fabric";
import { Point2D, VdrLayers } from "data-types-graphics";
import {
    BitmapElementVisual,
    BitmapVisualOptions,
    ControlElementVisual,
    ControlVisualOptions,
    DoubleBitmapElementVisual,
    DoubleBitmapVisualOptions,
    LineElementVisual,
    LineVisualOptions,
    Scene,
    TextVisualOptions,
    TextElementVisual,
} from "scene-types";
import { StratumError } from "~/helpers/errors";
import { HandleMap } from "~/helpers/handleMap";
import { FabricLine } from "./components/fabricLine";
import { FabricBitmap } from "./components/fabricBitmap";
import { FabricDoubleBitmap } from "./components/fabricDoubleBitmap";
import { fabricConfigCanvasOptions } from "./fabricConfig";
import { FabricText } from "./components/fabricText";
import { BrushToolState } from "vm-interfaces-graphics";
import { MessageCode } from "~/helpers/vmConstants";
import { systemKeysTemp } from "~/vm/operations/system";
import { HTMLInputElementsFactory } from "internal-graphic-types";
import { HtmlControl } from "../html/htmlControl";

type VisualObject = FabricLine | FabricBitmap | FabricDoubleBitmap | FabricText | HtmlControl;

const downCodes = [MessageCode.WM_LBUTTONDOWN, MessageCode.WM_MBUTTONDOWN, MessageCode.WM_RBUTTONDOWN];
const upCodes = [MessageCode.WM_LBUTTONUP, MessageCode.WM_MBUTTONUP, MessageCode.WM_RBUTTONUP];

export class FabricScene implements Scene {
    private canvas: fabric.StaticCanvas;
    private objects: HandleMap<VisualObject> = HandleMap.create();
    private inputFactory?: HTMLInputElementsFactory;
    private objectsByZReversed: VisualObject[] = [];
    private view: Point2D = { x: 0, y: 0 };
    private _redraw = false;

    private mouseSubs = new Set<(code: MessageCode, x: number, y: number) => void>();
    private controlsubs = new Set<(code: MessageCode, controlHandle: number) => void>();

    constructor({ canvas, inputFactory }: { canvas: HTMLCanvasElement; inputFactory?: HTMLInputElementsFactory }) {
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

        if (inputFactory) this.inputFactory = inputFactory;
        this.canvas = new fabric.StaticCanvas(canvas, {
            ...fabricConfigCanvasOptions,
            preserveObjectStacking: true,
            renderOnAddRemove: false,
        });
    }
    applyLayers(layers: VdrLayers): void {
        for (const obj of this.objects.values()) obj.applyLayers(layers);
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
        switch (type) {
            case "move":
                this.mouseSubs.forEach((s) => s(MessageCode.WM_MOUSEMOVE, x, y));
                return;
            case "up": {
                const code = upCodes[data.eventType === "mouse" ? data.e.button : 0];
                if (code) this.mouseSubs.forEach((s) => s(code, x, y));
                return;
            }
            case "down": {
                const code = downCodes[data.eventType === "mouse" ? data.e.button : 0];
                if (code) this.mouseSubs.forEach((s) => s(code, x, y));
                return;
            }
        }
    }
    adaptToNewSize(width: number, height: number): void {
        this.canvas.setWidth(width).setHeight(height).calcOffset();
    }
    updateBrush(brush: BrushToolState) {
        this.canvas.backgroundColor = brush.color;
    }

    private requestRedraw() {
        this._redraw = true;
    }

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

    appendLastObject(handle: number) {
        const obj = this.objects.get(handle);
        if (!obj) throw new StratumError(`Объект #${handle} не найден на сцене`);
        if (obj.type !== "control") this.canvas.add(obj.obj);
        this.objectsByZReversed = [obj].concat(this.objectsByZReversed);
        this.requestRedraw();
    }

    moveObjectToTop(handle: number) {
        const obj = this.objects.get(handle);
        if (!obj) return;
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

    translateView(x: number, y: number): void {
        this.view.x = x;
        this.view.y = y;
        for (const obj of this.objects.values()) obj.updateAfterViewTranslate();
        this.requestRedraw();
    }

    testVisualIntersection(visualHandle: number, x: number, y: number): boolean {
        const vs = this.objects.get(visualHandle);
        return vs ? vs.testIntersect(x, y) : false;
    }

    subscribeToMouseEvents(callback: (code: MessageCode, x: number, y: number) => void) {
        this.mouseSubs.add(callback);
    }
    subscribeToControlEvents(callback: (code: MessageCode, controlHandle: number) => void) {
        this.controlsubs.add(callback);
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
    render(): boolean {
        if (!this._redraw) return false;
        this._redraw = false;
        this.canvas.renderAll();
        return true;
    }

    forceRender() {
        this.canvas.renderAll();
        this._redraw = false;
    }

    private assertNoObject(handle: number) {
        if (this.objects.has(handle)) throw new StratumError(`Объект #${handle} уже существует на сцене`);
    }
    createLine(data: LineVisualOptions): LineElementVisual {
        this.assertNoObject(data.handle);
        const obj = new FabricLine(data, this.view, () => this.requestRedraw());
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
    createDoubleBitmap(data: DoubleBitmapVisualOptions): DoubleBitmapElementVisual {
        this.assertNoObject(data.handle);
        const obj = new FabricDoubleBitmap(data, this.view, () => this.requestRedraw());
        this.objects.set(data.handle, obj);
        return obj;
    }
}
