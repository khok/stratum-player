import { VmBool } from "vm-interfaces-base";
import { WindowState, WindowSystemController } from "vm-interfaces-windows";
import { StratumError } from "~/helpers/errors";
import { GraphicSpace } from "./graphicSpace/graphicSpace";
import { HTMLInputElementsFactory } from "internal-graphic-types";
import { HandleMap } from "~/helpers/handleMap";
import { HtmlFactory } from "~/helpers/htmlFactory";
import { EventDispatcher } from "~/helpers/eventDispatcher";

class Window implements WindowState {
    constructor(public space: GraphicSpace, private size: { x: number; y: number }) {}
    originX: number = 0;
    originY: number = 0;
    setOrigin(x: number, y: number): VmBool {
        this.originX = x;
        this.originY = y;
        return 1;
    }
    get width(): number {
        return this.size.x;
    }
    get height(): number {
        return this.size.y;
    }
    setSize(width: number, height: number): VmBool {
        console.warn("Ресайз окна пока не поддерживается");
        this.size.x = width;
        this.size.y = height;
        this.space.scene.adaptToNewSize(width, height);
        return 1;
    }

    getProp(prop: "classname" | "filename"): string {
        return this.space.source;
    }
}

export interface WindowSystemOptions {
    dispatcher?: EventDispatcher;
    multiwindow?: boolean;
    globalCanvas?: HTMLCanvasElement;
    htmlRoot?: HTMLElement;
    areaOriginX?: number;
    areaOriginY?: number;
    areaWidth?: number;
    areaHeight?: number;
    screenWidth?: number;
    screenHeight?: number;
}

export type MyResolver = (options: {
    canvas: HTMLCanvasElement;
    inputFactory?: HTMLInputElementsFactory;
}) => GraphicSpace;

export class WindowSystem implements WindowSystemOptions, WindowSystemController {
    areaOriginX: number = 0;
    areaOriginY: number = 0;
    areaWidth: number = 0;
    areaHeight: number = 0;
    screenHeight: number = 0;
    screenWidth: number = 0;
    globalCanvas?: HTMLCanvasElement;
    inputFactory?: HTMLInputElementsFactory;
    multiwindow?: boolean;
    dispatcher?: EventDispatcher;

    private spaces = HandleMap.create<GraphicSpace>();
    private windows = new Map<string, Window>();
    private spaceToWindowMap = HandleMap.create<string>();
    constructor(options: WindowSystemOptions = {}) {
        this.set(options);
    }

    set(options: WindowSystemOptions) {
        this.inputFactory = this.inputFactory || (options && options.htmlRoot && new HtmlFactory(options.htmlRoot));
        Object.assign(this, options);
        return this;
    }

    createSchemeWindow(windowName: string, flags: string, createSpace: MyResolver): number {
        if (this.hasWindow(windowName)) throw new StratumError(`Окно ${windowName} уже существует`);

        let canvas: HTMLCanvasElement;
        if (this.multiwindow) {
            throw new StratumError("Мультиоконность не реализована");
            //canvas = windows.createNew(...);
        } else {
            if (!this.globalCanvas) throw new StratumError("Canvas не установлен");
            if (this.windows.size > 0) throw new StratumError("Невозможно создать более одного окна");
            if (this.dispatcher) this.dispatcher.dispatch("WINDOW_CREATED", windowName);
            canvas = this.globalCanvas;
        }

        const spaceHandle = HandleMap.getFreeHandle(this.spaces); //поменять, т.к. стратум присваивает их иначе
        const space = createSpace({ canvas, inputFactory: this.inputFactory });
        space.handle = spaceHandle;
        this.spaces.set(spaceHandle, space);
        this.windows.set(windowName, new Window(space, { x: canvas.width, y: canvas.height }));
        this.spaceToWindowMap.set(spaceHandle, windowName);
        return spaceHandle;
    }

    getWindowBySpaceHandle(spaceHandle: number) {
        return this.spaceToWindowMap.get(spaceHandle);
    }

    renderAll() {
        let res = false;
        this.spaces.forEach(s => (res = s.scene.render() || res));
        return res;
    }

    hasWindow(windowName: string): VmBool {
        return this.windows.get(windowName) ? 1 : 0;
    }

    getWindow(windowName: string) {
        return this.windows.get(windowName);
    }

    getSpace(spaceHandle: number) {
        return this.spaces.get(spaceHandle);
    }
}
