import { HTMLInputElementsFactory } from "internal-graphic-types";
import { Scene } from "scene-types";
import { VmBool } from "vm-interfaces-base";
import { WindowState, GraphicSystemController } from "vm-interfaces-graphics";
import { StratumError } from "~/helpers/errors";
import { EventDispatcher } from "~/helpers/eventDispatcher";
import { HandleMap } from "~/helpers/handleMap";
import { HtmlFactory } from "~/helpers/htmlFactory";
import { BitmapToolFactory } from "./graphicSpace/bitmapToolFactory";
import { GraphicSpace } from "./graphicSpace/graphicSpace";
import { FabricScene } from "./renderers/fabric/fabricScene";

class Window implements WindowState {
    constructor(public space: GraphicSpace, private size: { x: number; y: number }, private resizable: boolean) {}
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
        this.size.x = width;
        this.size.y = height;
        if (this.resizable) this.space.scene.adaptToNewSize(width, height);
        else console.warn("Программное изменение размеров окна отключено");
        return 1;
    }

    getProp(prop: "classname" | "filename"): string {
        return this.space.sourceFilename;
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

export type MyResolver = (data: { bmpFactory: BitmapToolFactory; scene: Scene }) => GraphicSpace;

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

    createSchemeWindow(windowName: string, flags: string, createSpace: MyResolver): number {
        if (flags !== "") console.warn(`Флаги окна не поддерживаются: "${flags}"`);
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
        const scene = new FabricScene({ canvas, inputFactory: this.inputFactory });

        const spaceHandle = HandleMap.getFreeHandle(this.spaces);
        const space = createSpace({ scene, bmpFactory: this.bmpFactory });
        space.handle = spaceHandle;
        this.spaces.set(spaceHandle, space);
        this.windows.set(
            windowName,
            new Window(space, { x: canvas.width, y: canvas.height }, !this.disableSceneResize)
        );
        this.spaceToWinNameMap.set(spaceHandle, windowName);
        return spaceHandle;
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
