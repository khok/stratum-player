import { SmoothExecutor } from "stratum/common/computers";
import { eventCodeToWinDigit } from "stratum/helpers/keyboardEventKeyMap";
import { win1251Table } from "stratum/helpers/win1251";
import { InputElement2D } from "../elements/inputElement2d";
import {
    Scene,
    SceneArgs,
    SceneInputEvent,
    SceneInputEventCallback,
    SceneInputEventType,
    SceneKeyboardEvent,
    SceneKeyboardEventCallback,
    SceneKeyboardEventType,
    ScenePointerEvent,
    ScenePointerEventCallback,
    ScenePointerEventType,
} from "../scene";
import { ImageSVG } from "./imageSVG";
import { InputSVG } from "./inputSVG";
import { LineSVG } from "./lineSVG";
import { TextSVG } from "./textSVG";

type SVGChild = LineSVG | ImageSVG | TextSVG;
type HTMLChild = InputSVG;
type SVGOrHTMLChild = SVGChild | HTMLChild;

interface RendererSVGHandlers {
    pointermove: Set<ScenePointerEventCallback>;
    pointerdown: Set<ScenePointerEventCallback>;
    pointerup: Set<ScenePointerEventCallback>;
    keydown: Set<SceneKeyboardEventCallback>;
    keyup: Set<SceneKeyboardEventCallback>;
    keychar: Set<SceneKeyboardEventCallback>;
    inputState: Set<SceneInputEventCallback>;
}

export class RendererSVG extends Scene implements EventListenerObject {
    private static scenes = new Set<RendererSVG>();
    private static updater = new SmoothExecutor();

    private static redrawAll(): boolean {
        RendererSVG.scenes.forEach((w) => w.render());
        return RendererSVG.scenes.size > 0;
    }

    private static focusedScene: RendererSVG | null = null;
    private static captureTarget: RendererSVG | null = null; //FIXME: при установке капчура у других он сбрасываться не должен.
    private static currentScene: RendererSVG | null = null;

    private static _mouseX: number = 0;
    private static _mouseY: number = 0;

    static handleKeyboard(evt: KeyboardEvent) {
        const code = eventCodeToWinDigit.get(evt.code);
        if (typeof code !== "undefined") {
            Scene.keyState[code] = evt.type === "keydown" ? 1 : 0;
        }

        const realCode = code ?? 0;
        if (RendererSVG.captureTarget !== RendererSVG.focusedScene) RendererSVG.captureTarget?.handleKeyboard(evt, realCode);
        RendererSVG.focusedScene?.handleKeyboard(evt, realCode);
    }

    static handlePointer(evt: PointerEvent) {
        Scene.keyState[1] = evt.buttons & 1;
        Scene.keyState[2] = evt.buttons & 2;
        Scene.keyState[4] = evt.buttons & 4;
        RendererSVG._mouseX = evt.clientX;
        RendererSVG._mouseY = evt.clientY;

        const t = evt.target as SVGSVGElement;
        if (RendererSVG.currentScene?.root !== t) {
            RendererSVG.currentScene = null;
            for (const v of RendererSVG.scenes) {
                if (v.root.contains(t)) {
                    RendererSVG.currentScene = v;
                    break;
                }
            }
        }

        if (evt.type === "pointerdown") {
            RendererSVG.focusedScene = RendererSVG.currentScene;
        }
        // На тачпадах событие pointerdown также генерирует pointermove.
        // Таким образом обходим эту проблему.
        // this.blockFirstPointerMove = true;
        // } else if (type === "pointermove" && this.blockFirstPointerMove) {
        //     this.blockFirstPointerMove = false;
        //     return;
        // }

        if (RendererSVG.captureTarget !== RendererSVG.currentScene) RendererSVG.captureTarget?.handlePointer(evt);
        RendererSVG.currentScene?.handlePointer(evt);

        // if (evt.type === "pointerdown" && RendererSVG.kbdEvtReceiver) {
        //     console.log("here");
        //     RendererSVG.kbdEvtReceiver = null;
        // }
    }

    private lastElementsVer = -1;

    // private primaryMap = new WeakMap<PrimaryElement, PrimaryElementSVG>();
    private svgOrder: SVGChild[] = [];
    private htmlOrder: HTMLChild[] = [];
    private _rect: DOMRect | null = null;

    private handlers: RendererSVGHandlers = {
        pointerdown: new Set(),
        pointermove: new Set(),
        pointerup: new Set(),
        keydown: new Set(),
        keyup: new Set(),
        keychar: new Set(),
        inputState: new Set(),
    };
    // private blockFirstPointerMove = false;
    // _defs: SVGDefsElement;

    readonly view: HTMLDivElement;
    readonly root: SVGSVGElement;

    constructor(args?: SceneArgs) {
        super(args);

        const view = (this.view = document.createElement("div"));
        view.style.setProperty("overflow", "hidden"); //скрываем любые дочерние инпуты, которые вылазят за границу.
        view.style.setProperty("position", "relative"); //нужно, т.к. дочерние input-ы позиционируются абсолютно.
        view.style.setProperty("width", "100%");
        view.style.setProperty("height", "100%");
        view.style.setProperty("background-color", "white");

        this.root = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.root.addEventListener("selectstart", this);
        this.root.style.setProperty("width", "100%");
        this.root.style.setProperty("height", "100%");
        this.root.style.setProperty("touch-action", "pinch-zoom"); //было: "pan-x pan-y". pinch-zoom работает лучше.
        view.appendChild(this.root);

        // this.root.appendChild((this._defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")));
        RendererSVG.scenes.add(this);
        RendererSVG.updater.run(RendererSVG.redrawAll);
    }

    // private createOrder(elements: readonly PrimaryElementSVG[]): PrimaryElementSVG[] {
    //     let doc: DocumentFragment | null = null;
    //     const order = elements.map<PrimaryElementSVG>((cur) => {
    //         const cur = this.primaryMap.get(cur);
    //         if (cur) return cur;
    //         let p: PrimaryElementSVG;
    //         switch (cur.type) {
    //             case "line":
    //                 p = new LineRendererSVG(cur);
    //                 break;
    //             default:
    //                 throw Error(`Неизвестный тип: ${cur.type}`);
    //         }
    //         if (!doc) {
    //             doc = document.createDocumentFragment();
    //         }
    //         this.primaryMap.set(cur, p);
    //         this.order.push(p);
    //         doc.appendChild(p._svg);
    //         return p;
    //     });
    //     if (doc) this.root.appendChild(doc);
    //     return order;
    // }

    private createOrderSVG(elements: readonly SVGChild[]): SVGChild[] {
        let doc: DocumentFragment | null = null;
        const order = elements.map<SVGChild>((cur) => {
            if (cur._svg.parentElement) return cur;
            if (!doc) {
                doc = document.createDocumentFragment();
            }
            this.svgOrder.push(cur);
            doc.appendChild(cur._svg);
            return cur;
        });
        if (doc) this.root.appendChild(doc);
        return order;
    }

    private createOrderHTML(elements: readonly HTMLChild[]): HTMLChild[] {
        let doc: DocumentFragment | null = null;
        const order = elements.map<HTMLChild>((cur) => {
            if (cur._html.parentElement) return cur;
            if (!doc) {
                doc = document.createDocumentFragment();
            }
            this.htmlOrder.push(cur);
            doc.appendChild(cur._html);
            return cur;
        });
        if (doc) this.view.appendChild(doc);
        return order;
    }

    private static reoderSVG(root: SVGSVGElement, prevOrder: SVGChild[], newOrder: SVGChild[]): void {
        prevOrder.forEach((prev, prevIndex) => {
            // Новый индекс элемента.
            const newIndex = newOrder.indexOf(prev);
            // Его нет, элемент удален.
            if (newIndex < 0) {
                prev._svg.remove();
                return;
            }

            // Если элемент был последним.
            if (prevIndex === prevOrder.length - 1) {
                // Если элемент так и остался последним, ничего не делаем.
                if (newIndex === newOrder.length - 1) return;
                // Если же нет, переставляем на нужное место.
                root.insertBefore(prev._svg, newOrder[newIndex + 1]._svg);
                return;
            }
            // Элемент не был последим.

            // Элемент стал последним, перемещаем в конец.
            if (newIndex === newOrder.length - 1) {
                root.appendChild(prev._svg);
                return;
            }

            const prev2 = prevOrder[prevIndex + 1];
            const cur2 = newOrder[newIndex + 1];

            if (prev2 === cur2) return;
            root.insertBefore(prev._svg, cur2._svg);
        });
    }

    private static reoderHTML(root: HTMLDivElement, prevOrder: HTMLChild[], newOrder: HTMLChild[]): void {
        prevOrder.forEach((prev, prevIndex) => {
            // Новый индекс элемента.
            const newIndex = newOrder.indexOf(prev);
            // Его нет, элемент удален.
            if (newIndex < 0) {
                prev._html.remove();
                return;
            }

            // Если элемент был последним.
            if (prevIndex === prevOrder.length - 1) {
                // Если элемент так и остался последним, ничего не делаем.
                if (newIndex === newOrder.length - 1) return;
                // Если же нет, переставляем на нужное место.
                root.insertBefore(prev._html, newOrder[newIndex + 1]._html);
                return;
            }
            // Элемент не был последим.

            // Элемент стал последним, перемещаем в конец.
            if (newIndex === newOrder.length - 1) {
                root.appendChild(prev._html);
                return;
            }

            const prev2 = prevOrder[prevIndex + 1];
            const cur2 = newOrder[newIndex + 1];

            if (prev2 === cur2) return;
            root.insertBefore(prev._html, cur2._html);
        });
    }

    private rect(): DOMRect {
        if (!this._rect) {
            this._rect = this.root.getBoundingClientRect();
        }
        return this._rect;
    }

    render(): this {
        const els = this._elements as SVGOrHTMLChild[];

        if (this.lastElementsVer !== this._elementsVer) {
            this.lastElementsVer = this._elementsVer;

            const svgs: SVGChild[] = [];
            const htmls: InputSVG[] = [];

            els.forEach((e) => {
                if (e._svg) svgs.push(e);
                else htmls.push(e);
            });

            const svgOrder = this.createOrderSVG(svgs);
            const htmlOrder = this.createOrderHTML(htmls);

            RendererSVG.reoderSVG(this.root, this.svgOrder, svgOrder);
            this.svgOrder = svgOrder;
            RendererSVG.reoderHTML(this.view, this.htmlOrder, htmlOrder);
            this.htmlOrder = htmlOrder;
        }

        els.forEach((e) => e.render());
        this._rect = null;
        return this;
    }

    elementAtPoint(x: number, y: number): SVGChild | null {
        const rect = this.rect();
        const clientX = rect.left + x - this._offsetX;
        const clientY = rect.top + y - this._offsetY;
        const el = document.elementFromPoint(clientX, clientY);
        return (el && this.svgOrder.find((e) => e._svg.contains(el))) || null;
    }

    setCapture(): this {
        RendererSVG.captureTarget = this;
        return this;
    }
    releaseCapture(): this {
        RendererSVG.captureTarget = null;
        return this;
    }

    on(event: ScenePointerEventType, callback: ScenePointerEventCallback): this;
    on(event: SceneKeyboardEventType, callback: SceneKeyboardEventCallback): this;
    on(event: "inputState", callback: SceneInputEventCallback): this;
    on(event: keyof RendererSVG["handlers"], callback: any): this {
        this.handlers[event].add(callback);
        return this;
    }

    off(event: ScenePointerEventType, callback?: ScenePointerEventCallback): this;
    off(event: SceneKeyboardEventType, callback?: SceneKeyboardEventCallback): this;
    off(event: "inputState", callback?: SceneInputEventCallback): this;
    off(event: keyof RendererSVG["handlers"], callback: any): this {
        if (callback) {
            this.handlers[event].delete(callback);
        } else {
            this.handlers[event].clear();
        }
        return this;
    }

    mouseCoords(): [number, number] {
        const rect = this.rect();
        const clickX = RendererSVG._mouseX - rect.left; /// scene._scale;
        const clickY = RendererSVG._mouseY - rect.top; /// scene._scale;
        return [clickX, clickY];
    }

    // private overHyp = false;
    private handlePointer(evt: PointerEvent): void {
        // Если сцена является захваченной и сообщение обрабатывается не в window.handlePointer.
        // (защита от дублирования).
        // if (RendererSVG.pointerEvtReceiver === this && evt.currentTarget !== window) return;

        // Здесь можно было бы вызывать Scene.mouseCoords,
        // но там будут старые позиции - такая очередность событий.

        // Scene.keyState[1] = lmb;
        // Scene.keyState[2] = rmb;
        // Scene.keyState[4] = wheel;
        // RendererSVG._mouseX = evt.clientX;
        // RendererSVG._mouseY = evt.clientY;

        const type = evt.type as ScenePointerEventType;

        const rect = this.rect();
        const clickX = evt.clientX - rect.left; // / this._scale;
        const clickY = evt.clientY - rect.top; /// this._scale;
        const x = clickX + this._offsetX;
        const y = clickY + this._offsetY;
        const { button, buttons } = evt;

        const element = (evt.target !== evt.currentTarget && this.svgOrder.find((e) => e._svg.contains(evt.target as Node))) || null;
        const event: ScenePointerEvent = { target: this, type, clickX, clickY, x, y, buttons, button, element };

        this.handlers[type].forEach((h) => h(event));
        return;
    }

    private handleKeyboard(evt: KeyboardEvent, rawKey: number): void {
        const repeat = 1;
        const scan = 0;

        const type = evt.type as "keydown" | "keyup";
        const event: SceneKeyboardEvent = {
            type,
            target: this,
            repeat,
            scan,
            key: rawKey,
        };
        this.handlers[type].forEach((h) => h(event));

        if (type === "keydown") {
            //стрелки, Delete не отправляют WM_CHAR, т.к. не проходят TranslateMessage... Хер пойми как она работает.
            if ((rawKey > 36 && rawKey < 41) || rawKey === 46) return;

            const idx = win1251Table.indexOf(evt.key);
            const translatedKey = idx < 0 ? rawKey : idx;

            const event: SceneKeyboardEvent = {
                type: "keychar",
                target: this,
                repeat,
                scan,
                key: translatedKey,
            };
            this.handlers[type].forEach((h) => h(event));
        }
    }
    /*
        const objHandle = curObj?.handle ?? 0;
        const hyp = curObj?.hyperbase;
        if (hyp) {
            this.setCursor("pointer");
            this.overHyp = true;
        } else if (this.overHyp) {
            this.setCursor("default");
            this.overHyp = false;
        }

        switch (evt.type) {
            // https://developer.mozilla.org/ru/docs/Web/API/MouseEvent/button
            case "pointerdown": {
                Scene.kbdTarget = this;
                this.blockFirstPointerMove = true;
                switch (evt.button) {
                    case 0: //Левая кнопка
                        this.hyperHandler?.click(hyp ?? null, { x: clickX, y: clickY });
                        this.dispatchMouseEvent(this.leftButtonDownSubs, objHandle, Constant.WM_LBUTTONDOWN, x, y, fwkeys);
                        return;
                    case 1: //Колесико
                        this.dispatchMouseEvent(this.middleButtonDownSubs, objHandle, Constant.WM_MBUTTONDOWN, x, y, fwkeys);
                        return;
                    case 2: //Правая кнопка
                        this.dispatchMouseEvent(this.rightButtonDownSubs, objHandle, Constant.WM_RBUTTONDOWN, x, y, fwkeys);
                        return;
                }
                return;
            }
            case "pointerup": {
                switch (evt.button) {
                    case 0:
                        this.dispatchMouseEvent(this.leftButtonUpSubs, objHandle, Constant.WM_LBUTTONUP, x, y, fwkeys);
                        return;
                    case 1:
                        this.dispatchMouseEvent(this.middleButtonUpSubs, objHandle, Constant.WM_MBUTTONUP, x, y, fwkeys);
                        return;
                    case 2:
                        this.dispatchMouseEvent(this.rightButtonUpSubs, objHandle, Constant.WM_RBUTTONUP, x, y, fwkeys);
                        return;
                }
                return;
            }
            // case "pointerleave": {
            //     this.dispatchMouseEvent(this.leftButtonUpSubs, objHandle, Constant.WM_LBUTTONUP, x, y, 0);
            //     return;
            // }
            case "pointermove":
                if (this.blockFirstPointerMove) {
                    this.blockFirstPointerMove = false;
                    return;
                }
                this.dispatchMouseEvent(this.moveSubs, objHandle, Constant.WM_MOUSEMOVE, x, y, fwkeys);
                return;
        }
    }
*/

    // private dispatchMouseEvent(subs: Map<EventSubscriber, number>, curObj: number, code: Constant, realX: number, realY: number, keys: number): void {
    //     const mat = this.invMatrix;

    //     const w = realX * mat[2] + realY * mat[5] + mat[8];
    //     const x = (realX * mat[0] + realY * mat[3] + mat[6]) / w;
    //     const y = (realX * mat[1] + realY * mat[4] + mat[7]) / w;

    //     for (const [sub, objHandle] of subs) {
    //         if (objHandle === 0 || objHandle === curObj || sub === this.capture) sub.receive(code, x, y, keys);
    //     }
    // }

    // private dispatchKeyboardEvent(evt: KeyboardEvent, rawKey: number): void {
    //     const repeat = 1;
    //     const scanCode = 0;
    //     if (evt.type === "keydown") {
    //         this.keyDownSubs.forEach((sub) => sub.receive(Constant.WM_KEYDOWN, rawKey, repeat, scanCode));
    //         //стрелки, Delete не отправляют WM_CHAR, т.к. не проходят TranslateMessage... Хер пойми как она работает.
    //         if ((rawKey > 36 && rawKey < 41) || rawKey === 46) return;

    //         const idx = win1251Table.indexOf(evt.key);
    //         const translatedKey = idx < 0 ? rawKey : idx;
    //         this.keyCharSubs.forEach((sub) => sub.receive(258, translatedKey, repeat, scanCode)); //258 - WM_CHAR, нет в константах.
    //     } else {
    //         this.keyUpSubs.forEach((sub) => sub.receive(Constant.WM_KEYUP, rawKey, repeat, scanCode));
    //     }
    // }

    beforeRemove(): void {
        if (RendererSVG.currentScene === this) RendererSVG.currentScene = null;
        if (RendererSVG.focusedScene === this) RendererSVG.focusedScene = null;
        if (RendererSVG.captureTarget === this) RendererSVG.captureTarget = null;
    }

    // selectstart
    handleEvent(evt: Event): void {
        evt.preventDefault();
    }

    _dispatchInputEvent(element: InputElement2D, evt: Event) {
        switch (evt.type) {
            case "input":
            case "blur":
                break;
            case "focus":
                RendererSVG.focusedScene = null;
                break;
            default:
                return;
        }
        const type: SceneInputEventType = evt.type;

        const event: SceneInputEvent = {
            type,
            target: this,
            element,
        };
        this.handlers.inputState.forEach((h) => h(event));
    }
}

window.addEventListener("pointerdown", RendererSVG.handlePointer);
window.addEventListener("pointermove", RendererSVG.handlePointer);
window.addEventListener("pointerup", RendererSVG.handlePointer);
window.addEventListener("keydown", RendererSVG.handleKeyboard);
window.addEventListener("keyup", RendererSVG.handleKeyboard);
