import { GraphicSpaceResolver, VmBool, WindowFunctions, WindowingFunctions } from "../vm/types";
import { VectorDrawInstance } from "./vectorDrawInstance";

class Window implements WindowFunctions {
    constructor(public spaceHandle: number) {}
    originX: number = 0;
    originY: number = 0;
    setOrigin(x: number, y: number): VmBool {
        this.originX = x;
        this.originY = y;
        return 1;
    }
    get width(): number {
        return window.innerWidth;
    }
    get height(): number {
        return window.innerHeight;
    }
    setSize(width: number, height: number): VmBool {
        console.log("ресайз пока не поддерживается");
        // this.width = width;
        // this.height = height;
        return 1;
    }
}

export class WindowSystem implements WindowingFunctions {
    areaOriginX: number;
    areaOriginY: number;
    areaWidth: number;
    areaHeight: number;
    screenHeight: number;
    screenWidth: number;

    private spaces = new Map<number, VectorDrawInstance>();
    private windows = new Map<string, Window>();
    private canvas: HTMLCanvasElement;
    constructor() {
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.canvas.width = document.body.clientWidth;
        this.canvas.height = document.body.clientHeight;
        if (!this.canvas) throw Error("Canvas не найден");
        this.areaOriginX = this.areaOriginY = 0;
        this.screenHeight = this.areaWidth = 1920;
        this.screenWidth = this.areaHeight = 1080;
    }

    createSchemeWindow(windowName: string, flags: string, schemeResolver: GraphicSpaceResolver): number {
        // if (!this.multiwindow && !this.canvas) throw new Error("Canvas не назначен!");
        document.title = windowName;

        const spaceHandle = this.spaces.size + 1; //поменять
        this.spaces.set(spaceHandle, schemeResolver(this.canvas) as VectorDrawInstance);
        this.windows.set(windowName, new Window(spaceHandle));
        return spaceHandle;
    }

    renderAll() {
        this.spaces.forEach(s => s.render());
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
