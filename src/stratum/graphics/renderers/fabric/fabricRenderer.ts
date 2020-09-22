import { fabric } from "fabric";
import { StaticCanvas } from "fabric/fabric-impl";
import { colorRefToColor } from "~/common/colorrefParsers";
import { BadDataError, OptionsError } from "~/common/errors";
import { HtmlElementsFactory } from "~/graphics/renderers/fabric/html/htmlFactory";
import {
    RenderableBitmap,
    RenderableBmpParams,
    RenderableControl,
    RenderableControlParams,
    RenderableLine,
    RenderableLineParams,
    RenderableText,
    RenderableTextParams,
    Renderer,
} from "~/graphics/scene/interfaces";
import { SceneBrushTool } from "~/graphics/scene/tools";
import { InputEventReceiver } from "~/graphics/windowSystems/single/inputEventReceiver";
import { HandleMap } from "~/helpers/handleMap";
import { Point2D } from "~/helpers/types";
import { EventCode } from "~/vm/consts";
import { systemKeysTemp } from "~/vm/operations/system";
import { FabricImage, FabricLine, FabricText } from "./components";
import { canvasOptions } from "./fabricConfig";
import { HtmlControl } from "./html/htmlControl";

type FabricObject = FabricLine | FabricImage | FabricText | HtmlControl;

const downCodes = [EventCode.WM_LBUTTONDOWN, EventCode.WM_MBUTTONDOWN, EventCode.WM_RBUTTONDOWN];
const upCodes = [EventCode.WM_LBUTTONUP, EventCode.WM_MBUTTONUP, EventCode.WM_RBUTTONUP];

export interface FabricRendererArgs {
    canvas: StaticCanvas;
    htmlFactory?: HtmlElementsFactory;
}

export class FabricRenderer implements Renderer, InputEventReceiver {
    static createCanvas(canvas: HTMLCanvasElement) {
        return new fabric.StaticCanvas(canvas, canvasOptions);
    }

    private canvas: fabric.StaticCanvas;
    private objects: HandleMap<FabricObject> = HandleMap.create();
    private objectsByZReversed: FabricObject[] = [];

    private view: Point2D = { x: 0, y: 0 };

    private shouldRedraw = false;

    private mouseSubs = new Set<(code: EventCode, buttons: number, x: number, y: number) => void>();
    private controlsubs = new Set<(code: EventCode, controlHandle: number) => void>();

    private htmlFactory?: HtmlElementsFactory;

    constructor({ canvas, htmlFactory }: FabricRendererArgs) {
        this.htmlFactory = htmlFactory;
        this.canvas = canvas;
    }

    setSize(width: number, height: number): void {
        this.canvas.setWidth(width).setHeight(height).calcOffset();
    }

    getSize(): Point2D {
        return { x: this.canvas.getWidth(), y: this.canvas.getHeight() };
    }

    private requestRedraw() {
        this.shouldRedraw = true;
    }

    private assertNoObject(handle: number) {
        if (this.objects.has(handle)) throw new BadDataError(`Объект #${handle} уже существует на сцене`);
    }

    //Создание объектов
    //
    createLine(params: RenderableLineParams): RenderableLine {
        this.assertNoObject(params.handle);
        const obj = new FabricLine(params, this.view, () => this.requestRedraw());
        this.objects.set(params.handle, obj);
        return obj;
    }

    createText(params: RenderableTextParams): RenderableText {
        this.assertNoObject(params.handle);
        const obj = new FabricText(params, this.view, () => this.requestRedraw());
        this.objects.set(params.handle, obj);
        return obj;
    }

    createBitmap(params: RenderableBmpParams): RenderableBitmap {
        this.assertNoObject(params.handle);
        const obj = new FabricImage(params, this.view, () => this.requestRedraw());
        this.objects.set(params.handle, obj);
        return obj;
    }

    createControl(params: RenderableControlParams): RenderableControl {
        if (!this.htmlFactory) throw new OptionsError("inputFactory");
        this.assertNoObject(params.handle);
        const obj = new HtmlControl(params, this.view, this.htmlFactory);
        obj.onChange(() => {
            this.controlsubs.forEach((c) => c(EventCode.WM_CONTROLNOTIFY, params.handle));
            this.requestRedraw();
        });
        this.objects.set(params.handle, obj);
        return obj;
    }

    updateBrush(brush: SceneBrushTool) {
        const { bmpTool, color } = brush;
        if (bmpTool && bmpTool.image) this.canvas.backgroundImage = new fabric.Image(bmpTool.image);
        else this.canvas.backgroundColor = colorRefToColor(color);
        this.requestRedraw();
    }

    //Управление порядком отображения объектов.
    //
    placeObjects(order: number[]): void {
        const newObjs = [];
        for (const handle of order) {
            const obj = this.objects.get(handle);
            if (!obj) throw new BadDataError(`Объект #${handle} не найден на сцене`);
            if (obj.type !== "control") this.canvas.add(obj.obj);
            newObjs.push(obj);
        }
        this.objectsByZReversed = newObjs.reverse().concat(this.objectsByZReversed);
        this.requestRedraw();
    }

    appendObjectToEnd(obj: FabricObject) {
        if (obj.type !== "control") this.canvas.add(obj.obj);
        this.objectsByZReversed = [obj].concat(this.objectsByZReversed);
        this.requestRedraw();
    }

    moveObjectToTop(obj: FabricObject) {
        if (obj.type !== "control") obj.obj.bringToFront();
        const obzr = this.objectsByZReversed;
        this.objectsByZReversed = [obj].concat(obzr.filter((o) => o !== obj));
        this.requestRedraw();
    }

    moveObjectRangeToTop(visuals: FabricObject[]) {
        const newObjs: FabricObject[] = [];
        for (const obj of this.objectsByZReversed.reverse()) {
            if (visuals.includes(obj)) {
                if (obj.type !== "control") obj.obj.bringToFront();
                newObjs.push(obj);
            }
        }
        const obzr = this.objectsByZReversed;
        this.objectsByZReversed = newObjs.reverse().concat(obzr.filter((o) => !newObjs.includes(o)));
        this.requestRedraw();
    }

    removeObject(obj: FabricObject) {
        if (obj.type === "control") obj.destroyHtml();
        else this.canvas.remove(obj.obj);
        this.objects.delete(obj.handle);
        this.objectsByZReversed = this.objectsByZReversed.filter((o) => o !== obj);
        this.requestRedraw();
    }

    clear() {
        this.canvas.clear();
        for (const obj of this.objects.values()) if (obj.type === "control") obj.destroyHtml();
    }

    //Изменение точки обзора, размеров сцены.
    //
    setView(x: number, y: number): void {
        this.view.x = x;
        this.view.y = y;
        for (const obj of this.objects.values()) obj.updateAfterViewTranslate();
        this.requestRedraw();
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

    // preventMoveEvent = false;
    handleEvent({ x, y, buttons, button }: { x: number; y: number; buttons: number; button: number }, type: "down" | "up" | "move") {
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
                this.mouseSubs.forEach((s) => s(downCodes[button] || EventCode.WM_LBUTTONDOWN, buttons, xv, yv));
                break;
            case "up":
                systemKeysTemp[1] = 0;
                this.mouseSubs.forEach((s) => s(upCodes[button] || EventCode.WM_LBUTTONUP, 0, xv, yv));
                break;
            case "move":
                this.mouseSubs.forEach((s) => s(EventCode.WM_MOUSEMOVE, buttons, xv, yv));
                break;
        }
    }

    //Подписки на события от пользователя (клик мышью, изменение html текстбоксов)
    //
    subscribeToMouseEvents(callback: (code: EventCode, buttons: number, x: number, y: number) => void) {
        this.mouseSubs.add(callback);
    }
    subscribeToControlEvents(callback: (code: EventCode, controlHandle: number) => void) {
        this.controlsubs.add(callback);
    }
}
