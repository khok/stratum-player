import { InputEventReceiver } from "./inputEventReceiver";

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
type ListenerType =
    | { type: "touchstart"; listener: (event: TouchEvent) => any }
    | { type: "touchend"; listener: (event: TouchEvent) => any }
    | { type: "touchmove"; listener: (event: TouchEvent) => any }
    | { type: "mousedown"; listener: (event: MouseEvent) => any }
    | { type: "mouseup"; listener: (event: MouseEvent) => any }
    | { type: "mouseleave"; listener: (event: MouseEvent) => any }
    | { type: "mousemove"; listener: (event: MouseEvent) => any }
    | { type: "contextmenu"; listener: (event: MouseEvent) => any };

export class CanvasEventHandler {
    static createListeners(receiver: InputEventReceiver, canvas: HTMLCanvasElement) {
        let preventMouse = false;
        let lastTouch: Touch | undefined = undefined;

        const listeners: ListenerType[] = [
            {
                type: "touchstart",
                listener: (e) => {
                    preventMouse = true;
                    if (e.touches.length > 1 && lastTouch) {
                        receiver.handleEvent(convertTouch(lastTouch, canvas.getBoundingClientRect()), "up");
                        lastTouch = undefined;
                        return;
                    }

                    if (lastTouch !== undefined) return;

                    const t = e.changedTouches[0];
                    lastTouch = t;
                    receiver.handleEvent(convertTouch(t, canvas.getBoundingClientRect()), "down");
                },
            },
            {
                type: "touchend",
                listener: (e) => {
                    preventMouse = true;
                    if (lastTouch === undefined) return;
                    const t = e.changedTouches[lastTouch.identifier];
                    if (!t) return;

                    lastTouch = undefined;
                    receiver.handleEvent(convertTouch(t, canvas.getBoundingClientRect()), "up");
                },
            },
            {
                type: "touchmove",
                listener: (e) => {
                    preventMouse = true;
                    if (e.touches.length < 2) e.preventDefault();

                    if (lastTouch === undefined) return;
                    const t = e.changedTouches[lastTouch.identifier];
                    if (!t) return;

                    const rect = canvas.getBoundingClientRect();
                    const data = convertTouch(t, rect);
                    if (data.x < 0 || data.y < 0 || data.x > rect.width || data.y > rect.height)
                        receiver.handleEvent(convertTouch(lastTouch, rect), "up");
                    else receiver.handleEvent(data, "move");
                    lastTouch = t;
                },
            },

            //mouse
            {
                type: "mousedown",
                listener: (e) => {
                    if (preventMouse) {
                        preventMouse = false;
                        return;
                    }
                    receiver.handleEvent(convertMouse(e), "down");
                },
            },
            {
                type: "mouseup",
                listener: (e) => {
                    if (preventMouse) {
                        preventMouse = false;
                        return;
                    }
                    receiver.handleEvent(convertMouse(e), "up");
                },
            },
            {
                type: "mouseleave",
                listener: (e) => {
                    receiver.handleEvent(convertMouse(e), "up");
                },
            },
            {
                type: "mousemove",
                listener: (e) => {
                    receiver.handleEvent(convertMouse(e), "move");
                },
            },
            { type: "contextmenu", listener: (e) => e.preventDefault() },
        ];
        return listeners;
    }

    private evts?: ListenerType[];
    private canvas?: HTMLCanvasElement;

    setCanvas(canvas?: HTMLCanvasElement) {
        if (this.canvas === canvas) return false;
        this.removeListeners();
        this.canvas = canvas;
        return true;
    }

    setReceiver(receiver: InputEventReceiver) {
        const canvas = this.canvas;
        if (!canvas) return false;
        this.removeListeners();

        const listeners = CanvasEventHandler.createListeners(receiver, canvas);
        for (const evt of listeners) canvas.addEventListener(evt.type, evt.listener as any);
        this.evts = listeners;
        return true;
    }

    removeListeners() {
        if (!this.evts || !this.canvas) return;
        for (const evt of this.evts) this.canvas.removeEventListener(evt.type, evt.listener as any);
        this.evts = undefined;
    }
}
