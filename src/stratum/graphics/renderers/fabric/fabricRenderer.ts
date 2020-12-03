import { fabric } from "fabric";
import { colorRefToColor } from "stratum/common/colorrefParsers";
import { SYSTEM_KEYS } from "stratum/graphics/graphicsManager";
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
} from "stratum/graphics/scene/interfaces";
import { SceneBrushTool } from "stratum/graphics/scene/tools";
import { SceneWindow } from "stratum/graphics/sceneWindow";
import { BadDataError } from "stratum/helpers/errors";
import { HandleMap } from "stratum/helpers/handleMap";
import { Point2D } from "stratum/helpers/types";
import { Constant, EventSubscriber } from "stratum/translator";
import { FabricImage, FabricLine, FabricText } from "./components";
import { HtmlControl } from "./components/htmlControl";
import { canvasOptions } from "./fabricConfig";

type FabricObject = FabricLine | FabricImage | FabricText | HtmlControl;

// const downCodes = [EventCode.WM_LBUTTONDOWN, EventCode.WM_MBUTTONDOWN, EventCode.WM_RBUTTONDOWN];
// const upCodes = [EventCode.WM_LBUTTONUP, EventCode.WM_MBUTTONUP, EventCode.WM_RBUTTONUP];

export class FabricRenderer implements Renderer {
    private canvas: fabric.StaticCanvas;
    private objects: HandleMap<FabricObject> = HandleMap.create();
    private objectsByZReversed: FabricObject[] = [];
    private view: Point2D = { x: 0, y: 0 };
    private shouldRedraw = false;

    constructor(canvas: HTMLCanvasElement, private wnd: SceneWindow, private sceneHandle: number) {
        this.canvas = new fabric.StaticCanvas(canvas, canvasOptions);

        // let ts = 0;
        let dontTriggerMouse = 0;
        const mouseHandler = (evt: MouseEvent) => {
            evt.preventDefault();
            if (dontTriggerMouse > 0) {
                --dontTriggerMouse;
                return;
            }
            // if (evt.type === "mousemove") {
            //     if (evt.timeStamp - ts < 50) return;
            //     ts = evt.timeStamp;
            // }

            const rect = (evt.target as HTMLCanvasElement).getBoundingClientRect();
            const x = this.view.x + evt.clientX - rect.left;
            const y = this.view.y + evt.clientY - rect.top;

            const lmb = evt.buttons & 1 ? 1 : 0;
            const rmb = evt.buttons & 2 ? 2 : 0;
            const wheel = evt.buttons & 4 ? 16 : 0;
            const fwkeys = lmb | rmb | wheel;

            SYSTEM_KEYS[1] = lmb;
            // systemKeysTemp[1] = rmb;
            SYSTEM_KEYS[4] = wheel;
            switch (evt.type) {
                // https://developer.mozilla.org/ru/docs/Web/API/MouseEvent/button
                case "mousedown": {
                    switch (evt.button) {
                        case 0: //Левая кнопка
                            this.mevent(this.leftButtonDownSubs, Constant.WM_LBUTTONDOWN, x, y, fwkeys);
                            return;
                        case 1: //Колесико
                            this.mevent(this.middleButtonDownSubs, Constant.WM_MBUTTONDOWN, x, y, fwkeys);
                            return;
                        case 2: //Правая кнопка
                            // this.mevent(this.rightButtonDownSubs, EventCode.WM_RBUTTONDOWN, x, y, fwkeys);
                            return;
                    }
                    return;
                }
                case "mouseup": {
                    switch (evt.button) {
                        case 0:
                            this.mevent(this.leftButtonUpSubs, Constant.WM_LBUTTONUP, x, y, fwkeys);
                            return;
                        case 1:
                            this.mevent(this.middleButtonUpSubs, Constant.WM_MBUTTONUP, x, y, fwkeys);
                            return;
                        case 2:
                            // this.mevent(this.rightButtonUpSubs, EventCode.WM_RBUTTONUP, x, y, fwkeys);
                            return;
                    }
                    return;
                }
                case "mousemove":
                    this.mevent(this.moveSubs, Constant.WM_MOUSEMOVE, x, y, fwkeys);
                    return;
            }
        };
        canvas.addEventListener("mousedown", mouseHandler);
        canvas.addEventListener("mouseup", mouseHandler);
        canvas.addEventListener("mousemove", mouseHandler);

        let lastX = 0;
        let lastY = 0;
        let scrollEnabled = false;
        const touchHandler = (evt: TouchEvent) => {
            // Если жмем двумя пальцами, то событие не обрабатываем.
            if (evt.targetTouches.length > 1) {
                if (scrollEnabled === true) return;
                scrollEnabled = true;
                // Перед активацией скрола тригернем MOUSEUP
                SYSTEM_KEYS[1] = 0;
                this.mevent(this.leftButtonUpSubs, Constant.WM_LBUTTONUP, lastX, lastY, 0);
                return;
            }
            scrollEnabled = false;

            if (evt.type === "touchend") {
                dontTriggerMouse = 3;
                SYSTEM_KEYS[1] = 0;
                this.mevent(this.leftButtonUpSubs, Constant.WM_LBUTTONUP, lastX, lastY, 0);
                return;
            }
            dontTriggerMouse = 0;
            const rect = (evt.target as HTMLCanvasElement).getBoundingClientRect();

            const touch = evt.targetTouches[0];
            const localX = touch.clientX - rect.left;
            const localY = touch.clientY - rect.top;

            SYSTEM_KEYS[1] = 1;
            if (evt.type === "touchstart") {
                lastX = this.view.x + localX;
                lastY = this.view.y + localY;
                this.mevent(this.leftButtonDownSubs, Constant.WM_LBUTTONDOWN, lastX, lastY, 1);
            } else {
                // if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) return;
                if (evt.cancelable === false) return;
                // Если жмем одним пальцем, то дисаблим перемещение экрана.
                evt.preventDefault();
                // Если тач вышел за пределы канваса, не отправляем событие.
                // Это можно и отключить, а лучше - предлагать выбор пользователю (touchOutStrategy).
                if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) return;
                lastX = this.view.x + localX;
                lastY = this.view.y + localY;
                this.mevent(this.moveSubs, Constant.WM_MOUSEMOVE, lastX, lastY, 1);
            }
        };

        canvas.addEventListener("touchstart", touchHandler);
        canvas.addEventListener("touchend", touchHandler);
        canvas.addEventListener("touchmove", touchHandler);
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
        this.assertNoObject(params.handle);
        const obj = new HtmlControl(params, this.view, this.wnd);
        // obj.onChange(() => {
        //     this.controlSubs.forEach((c) => c(EventCode.WM_CONTROLNOTIFY, params.handle));
        //     this.requestRedraw();
        // });
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
    private pointInObject(visualHandle: number, x: number, y: number): boolean {
        const obj = this.objects.get(visualHandle);
        return obj !== undefined ? obj.hasPoint(x, y) : false;
    }

    handleAtPoint(x: number, y: number): number {
        for (const obj of this.objectsByZReversed) if (obj.selectable === true && obj.testIntersect(x, y)) return obj.handle;
        return 0;
    }

    setWidth(width: number) {
        this.canvas.setWidth(width);
    }

    setHeight(height: number) {
        this.canvas.setHeight(height);
    }

    calcOffset() {
        this.canvas.calcOffset();
        this.shouldRedraw = true;
    }

    redraw(): boolean {
        if (this.shouldRedraw === false) return false;
        this.shouldRedraw = false;
        this.canvas.renderAll();
        return true;
    }

    private moveSubs = new Map<EventSubscriber, number>();
    private leftButtonUpSubs = new Map<EventSubscriber, number>();
    private leftButtonDownSubs = new Map<EventSubscriber, number>();
    private rightButtonUpSubs = new Map<EventSubscriber, number>();
    private rightButtonDownSubs = new Map<EventSubscriber, number>();
    private middleButtonUpSubs = new Map<EventSubscriber, number>();
    private middleButtonDownSubs = new Map<EventSubscriber, number>();
    onMouse(sub: EventSubscriber, code: Constant, handle: number) {
        switch (code) {
            case Constant.WM_MOUSEMOVE:
                this.moveSubs.set(sub, handle);
                break;
            case Constant.WM_LBUTTONDOWN:
                this.leftButtonDownSubs.set(sub, handle);
                break;
            case Constant.WM_LBUTTONUP:
                this.leftButtonUpSubs.set(sub, handle);
                break;
            // case EventCode.WM_LBUTTONDBLCLK:
            //     break;
            case Constant.WM_RBUTTONDOWN:
                this.rightButtonDownSubs.set(sub, handle);
                break;
            case Constant.WM_RBUTTONUP:
                this.rightButtonUpSubs.set(sub, handle);
                break;
            // case EventCode.WM_RBUTTONDBLCLK:
            //     break;
            case Constant.WM_MBUTTONDOWN:
                this.middleButtonDownSubs.set(sub, handle);
                break;
            case Constant.WM_MBUTTONUP:
                this.middleButtonUpSubs.set(sub, handle);
                break;
            // case EventCode.WM_MBUTTONDBLCLK:
            //     break;
            case Constant.WM_ALLMOUSEMESSAGE:
                this.moveSubs.set(sub, handle);
                this.leftButtonDownSubs.set(sub, handle);
                this.leftButtonUpSubs.set(sub, handle);
                this.rightButtonDownSubs.set(sub, handle);
                this.rightButtonUpSubs.set(sub, handle);
                this.middleButtonDownSubs.set(sub, handle);
                this.middleButtonUpSubs.set(sub, handle);
                break;
        }
    }

    offMouse(sub: EventSubscriber, code: Constant) {
        switch (code) {
            case Constant.WM_MOUSEMOVE:
                this.moveSubs.delete(sub);
                break;
            case Constant.WM_LBUTTONDOWN:
                this.leftButtonDownSubs.delete(sub);
                break;
            case Constant.WM_LBUTTONUP:
                this.leftButtonUpSubs.delete(sub);
                break;
            // case EventCode.WM_LBUTTONDBLCLK:
            //     break;
            case Constant.WM_RBUTTONDOWN:
                this.rightButtonDownSubs.delete(sub);
                break;
            case Constant.WM_RBUTTONUP:
                this.rightButtonUpSubs.delete(sub);
                break;
            // case EventCode.WM_RBUTTONDBLCLK:
            //     break;
            case Constant.WM_MBUTTONDOWN:
                this.middleButtonDownSubs.delete(sub);
                break;
            case Constant.WM_MBUTTONUP:
                this.middleButtonUpSubs.delete(sub);
                break;
            // case EventCode.WM_MBUTTONDBLCLK:
            //     break;
            case Constant.WM_ALLMOUSEMESSAGE:
                this.moveSubs.delete(sub);
                this.leftButtonDownSubs.delete(sub);
                this.leftButtonUpSubs.delete(sub);
                this.rightButtonDownSubs.delete(sub);
                this.rightButtonUpSubs.delete(sub);
                this.middleButtonDownSubs.delete(sub);
                this.middleButtonUpSubs.delete(sub);
                break;
        }
    }

    private mevent(subs: Map<EventSubscriber, number>, code: Constant, x: number, y: number, keys: number) {
        for (const [sub, handle] of subs) {
            if (handle < 1 || sub.captureEventsFromSpace === this.sceneHandle || this.pointInObject(handle, x, y)) sub.receive(code, x, y, keys);
        }
    }
}
