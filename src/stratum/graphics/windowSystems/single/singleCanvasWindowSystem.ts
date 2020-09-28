import { fabric } from "fabric";
import { OptionsError } from "stratum/common/errors";
import { FabricRendererArgs } from "stratum/graphics/renderers/fabric/fabricRenderer";
import { RendererWindow, WindowSystem } from "../../manager/interfaces";
import { FabricRenderer } from "../../renderers";
import { HtmlElementsFactory } from "../../renderers/fabric/html/htmlFactory";
import { CanvasEventHandler } from "./canvasEventHandler";

export interface SingleCanvasWindowSystemOptions {
    screenWidth?: number;
    screenHeight?: number;
    areaOriginX?: number;
    areaOriginY?: number;
    areaWidth?: number;
    areaHeight?: number;

    globalCanvas?: HTMLCanvasElement;
    htmlRoot?: HTMLElement;

    disableSceneResize?: boolean;
}

export class FabricWindow implements RendererWindow {
    name: string;
    renderer: FabricRenderer;

    originX: number;
    originY: number;
    width: number;
    height: number;
    private evtHandler = new CanvasEventHandler();
    private ws: SingleCanvasWindowSystem;

    constructor(name: string, ws: SingleCanvasWindowSystem, args: FabricRendererArgs) {
        this.ws = ws;
        this.name = name;
        this.evtHandler.setCanvas(args.canvas.getElement());
        this.renderer = new FabricRenderer(args);
        this.evtHandler.setReceiver(this.renderer);

        this.originX = 0;
        this.originY = 0;
        this.width = args.canvas.getWidth();
        this.height = args.canvas.getHeight();
        document.title = name;
    }

    setOrigin(x: number, y: number): void {
        this.originX = x;
        this.originY = y;
        if (this.originChanged) this.originChanged(x, y);
    }

    originChanged?: (x: number, y: number) => void;

    setSize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        if (!this.ws.disableSceneResize) this.renderer.setSize(width, height);
        if (this.sizeChanged) this.sizeChanged(width, height);
    }
    sizeChanged?: (x: number, y: number) => void;

    redraw(): boolean {
        return this.renderer.render();
    }

    close(): void {
        this.renderer.clear();
        this.evtHandler.removeListeners();
        this.ws.releaseWindow();
    }
}

export class SingleCanvasWindowSystem implements WindowSystem, SingleCanvasWindowSystemOptions {
    private htmlFactory?: HtmlElementsFactory;
    private fabricCanvas?: fabric.StaticCanvas;

    screenWidth: number = 0;
    screenHeight: number = 0;
    areaOriginX: number = 0;
    areaOriginY: number = 0;
    areaWidth: number = 0;
    areaHeight: number = 0;
    disableSceneResize: boolean = false;

    private window?: FabricWindow;

    constructor(options?: SingleCanvasWindowSystemOptions) {
        this.set(options || {});
    }

    set(options: SingleCanvasWindowSystemOptions) {
        if (options.htmlRoot) this.htmlFactory = new HtmlElementsFactory(options.htmlRoot);
        if (options.globalCanvas && (!this.fabricCanvas || this.fabricCanvas.getElement() !== options.globalCanvas))
            this.fabricCanvas = FabricRenderer.createCanvas(options.globalCanvas);
        Object.assign(this, options);
        return this;
    }

    createWindow(name: string): FabricWindow {
        if (this.window) {
            throw new Error(`Невозможно открыть более одного окна`);
        }
        const { fabricCanvas, htmlFactory } = this;
        if (!fabricCanvas) throw new OptionsError("globalCanvas");
        this.window = new FabricWindow(name, this, { canvas: fabricCanvas, htmlFactory });
        return this.window;
    }

    redrawWindows() {
        return this.window ? this.window.redraw() : false;
    }

    releaseWindow() {
        this.window = undefined;
    }
}
