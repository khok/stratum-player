import { VmBool } from "vm-interfaces-base";
import { GraphicSpaceState } from "vm-interfaces-graphics";
import { WindowState, WindowSystemController } from "vm-interfaces-windows";
import { StratumError } from "~/helpers/errors";
import { GraphicSpace } from "./graphicSpace/graphicSpace";

class Window implements WindowState {
    constructor(public space: GraphicSpaceState, private size: { x: number; y: number }) {}
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
        // this.height = height;
        return 1;
    }
}

export interface WindowSystemOptions {
    globalCanvas?: HTMLCanvasElement;
    areaOriginX?: number;
    areaOriginY?: number;
    areaWidth?: number;
    areaHeight?: number;
    screenWidth?: number;
    screenHeight?: number;
}

export class WindowSystem implements WindowSystemController {
    areaOriginX: number = 0;
    areaOriginY: number = 0;
    areaWidth: number = 0;
    areaHeight: number = 0;
    screenHeight: number = 0;
    screenWidth: number = 0;
    private globalCanvas?: HTMLCanvasElement;

    private spaces = new Map<number, GraphicSpace>();
    private windows = new Map<string, Window>();
    private multiwindow?: boolean;
    private onWindowCreated?: (windowName: string) => void;
    constructor(
        options: WindowSystemOptions & {
            multiwindow?: boolean;
            onWindowCreated?: (windowName: string) => void;
        } = {}
    ) {
        Object.assign(this, options);
    }

    set(options: WindowSystemOptions) {
        Object.assign(this, options);
        return this;
    }

    createSchemeWindow(
        windowName: string,
        flags: string,
        createSpace: (options: HTMLCanvasElement) => GraphicSpace
    ): number {
        if (this.hasWindow(windowName)) throw new StratumError(`Окно ${windowName} уже существует`);

        let canvas: HTMLCanvasElement;
        if (this.multiwindow) {
            throw new StratumError("Мультиоконность не реализована");
            //canvas = windows.createNew(...);
        } else {
            if (!this.globalCanvas) throw new StratumError("Canvas не установлен");
            if (this.windows.size > 0) throw new StratumError("Невозможно создать более одного окна");
            if (this.onWindowCreated) this.onWindowCreated(windowName);
            canvas = this.globalCanvas;
        }

        const spaceHandle = this.spaces.size + 1; //поменять, т.к. стратум присваивает их иначе
        const space = createSpace(canvas);
        space.handle = spaceHandle;
        this.spaces.set(spaceHandle, space);
        this.windows.set(windowName, new Window(space, { x: canvas.width, y: canvas.height }));
        return spaceHandle;
    }

    renderAll() {
        this.spaces.forEach(s => s.scene.render());
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
