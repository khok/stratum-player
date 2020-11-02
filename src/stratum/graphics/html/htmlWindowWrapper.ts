import { SimpleComputer } from "stratum/common/simpleComputer";
import { FabricRenderer } from "../renderers";
import { InputEventReceiver, Renderer } from "../scene/interfaces";
import { addListeners } from "./createListeners";
import { HTMLInputWrapper, HTMLInputWrapperOptions } from "./htmlInputWrapper";

export interface HTMLWindowWrapperOptions {
    disableWindowResize?: boolean;
    width?: number;
    height?: number;
}

export class HTMLWindowWrapper {
    private readonly container: HTMLDivElement;
    private renderer?: FabricRenderer;
    private computer = new SimpleComputer();
    private disableResize: boolean;
    constructor(root: HTMLElement, tag: string, opts: HTMLWindowWrapperOptions = {}) {
        const container = document.createElement("div");
        container.setAttribute("id", root.id + "_" + tag);
        container.style.setProperty("position", "relative");
        container.style.setProperty("width", opts.width ? opts.width + "px" : "100%");
        container.style.setProperty("height", opts.height ? opts.height + "px" : "100%");
        this.disableResize = opts.disableWindowResize || false;
        container.style.setProperty("overflow", "hidden");
        root.appendChild(container);
        this.container = container;
    }

    allocateRenderer(): (Renderer & InputEventReceiver) | undefined {
        if (this.renderer) return undefined;
        const canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;
        this.container.appendChild(canvas);
        const rnd = new FabricRenderer(canvas, this);
        addListeners(rnd, canvas);
        this.computer.run(() => rnd.redraw() || true);
        this.renderer = rnd;
        return rnd;
    }

    setTitle(value: string) {
        document.title = value;
    }

    get height() {
        return this.container.clientHeight;
    }

    get width() {
        return this.container.clientWidth;
    }

    private sizeWarned = false;
    fixedSize(x: number, y: number): boolean {
        if (this.disableResize) {
            if (!this.sizeWarned) console.warn(`Проект попытался установить размеры окна в (${x}, ${y})`);
            this.sizeWarned = true;
            return false;
        }
        this.container.style.setProperty("width", x + "px");
        this.container.style.setProperty("height", y + "px");
        return true;
    }

    textInput(options: HTMLInputWrapperOptions): HTMLInputWrapper {
        const elem = document.createElement("input");
        elem.setAttribute("type", "text");
        elem.style.setProperty("position", "absolute");
        const wrapper = new HTMLInputWrapper(elem, options);
        this.container.appendChild(elem);
        return wrapper;
    }

    close(deleteRoot: boolean) {
        const { container, computer } = this;
        computer.stop();
        if (deleteRoot) container.remove();
        else {
            while (container.firstChild) {
                container.removeChild(container.lastChild!);
            }
            this.renderer = undefined;
        }
    }
}
