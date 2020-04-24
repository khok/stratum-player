import { HTMLInputElementsFactory } from "html-types";
import { VmBool } from "vm-interfaces-core";
import { CreateSchemeWindowOptions, GraphicSystemController, WindowState } from "vm-interfaces-graphics";
import { StratumError } from "~/helpers/errors";
import { EventDispatcher } from "~/helpers/eventDispatcher";
import { HandleMap } from "~/helpers/handleMap";
import { HtmlFactory } from "~/helpers/htmlFactory";
import { BitmapToolFactory, GraphicSpace } from "./graphicSpace";
import { FabricScene } from "./renderers";

export interface WindowOptions {
    space: GraphicSpace;
    size: { width: number; height: number };
    resizable: boolean;
    names: {
        filename?: string;
        classname?: string;
    };
}

class Window implements WindowState {
    private resizable: boolean;
    private classname: string;
    private filename: string;

    readonly space: GraphicSpace;

    originX: number = 0;
    originY: number = 0;
    width: number;
    height: number;

    constructor(data: WindowOptions) {
        this.space = data.space;
        this.width = data.size.width;
        this.height = data.size.height;
        this.resizable = data.resizable;
        this.classname = data.names.classname || "";
        this.filename = data.names.filename || "";
    }

    setOrigin(x: number, y: number): VmBool {
        this.originX = x;
        this.originY = y;
        return 1;
    }

    setSize(width: number, height: number): VmBool {
        this.width = width;
        this.height = height;
        if (this.resizable) this.space.scene.adaptToNewSize(width, height);
        else console.warn("Программное изменение размеров окна отключено");
        return 1;
    }

    getProp(prop: "classname" | "filename"): string {
        return prop === "classname" ? this.classname : this.filename;
    }
}

export interface GraphicSystemOptions {
    screenWidth?: number;
    screenHeight?: number;
    areaOriginX?: number;
    areaOriginY?: number;
    areaWidth?: number;
    areaHeight?: number;
    htmlRoot?: HTMLElement;
    dispatcher?: EventDispatcher;
    multiwindow?: boolean;
    globalCanvas?: HTMLCanvasElement;
    disableSceneResize?: boolean;
}

export class GraphicSystem implements GraphicSystemOptions, GraphicSystemController {
    screenWidth: number = 0;
    screenHeight: number = 0;
    areaOriginX: number = 0;
    areaOriginY: number = 0;
    areaWidth: number = 0;
    areaHeight: number = 0;
    inputFactory?: HTMLInputElementsFactory;
    dispatcher?: EventDispatcher;
    multiwindow?: boolean;
    globalCanvas?: HTMLCanvasElement;
    disableSceneResize?: boolean;

    private spaces = HandleMap.create<GraphicSpace>();
    private windows = new Map<string, Window>();
    private spaceToWinNameMap = HandleMap.create<string>();
    constructor(private bmpFactory: BitmapToolFactory, options?: GraphicSystemOptions) {
        this.set(options || {});
    }

    set(options: GraphicSystemOptions) {
        this.inputFactory = options.htmlRoot ? new HtmlFactory(options.htmlRoot) : this.inputFactory;
        Object.assign(this, options);
        return this;
    }

    createSchemeWindow(windowName: string, attrib: string, data?: CreateSchemeWindowOptions): number {
        if (attrib !== "") console.warn(`Атрибуты окна не поддерживаются: "${attrib}"`);
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

        const { bmpFactory, inputFactory } = this;

        const handle = HandleMap.getFreeHandle(this.spaces);
        const space = new GraphicSpace({
            handle,
            bmpFactory,
            vdr: data && data.vdr,
            scene: new FabricScene({ canvas, inputFactory }),
        });
        this.spaces.set(handle, space);

        this.windows.set(
            windowName,
            new Window({
                space,
                size: { width: canvas.width, height: canvas.height },
                resizable: !this.disableSceneResize,
                names: data || {},
            })
        );

        this.spaceToWinNameMap.set(handle, windowName);
        return handle;
    }

    getWindowBySpaceHandle(spaceHandle: number) {
        return this.spaceToWinNameMap.get(spaceHandle);
    }

    renderAll() {
        let res = false;
        this.spaces.forEach((s) => (res = s.scene.render() || res));
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
