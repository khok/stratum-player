import { SimpleComputer } from "stratum/common/simpleComputer";
import { FabricRenderer } from "../renderers";
import { InputEventReceiver, Renderer } from "../scene/interfaces";
import { addListeners } from "./createListeners";
import { InputWrapper, InputWrapperOptions } from "./inputWrapper";

export interface WindowWrapperOptions {
    disableWindowResize?: boolean;
    width?: number;
    height?: number;
}

export class WindowWrapper {
    private _container?: HTMLDivElement;
    private _renderer?: Renderer & InputEventReceiver;
    private computer = new SimpleComputer();
    private disableResize: boolean = false;

    constructor(private root: HTMLElement, private opts: WindowWrapperOptions = {}) {}

    private get container() {
        if (this._container) return this._container;

        //prettier-ignore
        const { root, opts: { width, height, disableWindowResize } } = this;

        const container = document.createElement("div");
        container.style.setProperty("position", "relative");
        container.style.setProperty("width", width && width > 0 ? width + "px" : "100%");
        container.style.setProperty("height", height && height > 0 ? height + "px" : "100%");
        container.style.setProperty("overflow", "hidden");
        this.disableResize = disableWindowResize || false;
        root.appendChild(container);
        return (this._container = container);
    }

    get renderer(): Renderer & InputEventReceiver {
        if (this._renderer) return this._renderer;

        const canvas = document.createElement("canvas");
        const rnd = new FabricRenderer(canvas, this);
        addListeners(rnd, canvas);
        this.computer.run(() => rnd.redraw() || true);
        this.container.appendChild(canvas);
        return (this._renderer = rnd);
    }

    destroy() {
        if (!this._container) return;
        if (this._renderer) {
            this.computer.stop();
            this._renderer = undefined;
        }
        this._container.remove();
        this._container = undefined;
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
        const cndStyle = this.container.style;
        cndStyle.setProperty("width", x + "px");
        cndStyle.setProperty("height", y + "px");
        return true;
    }

    textInput(options: InputWrapperOptions): InputWrapper {
        const elem = document.createElement("input");
        elem.setAttribute("type", "text");
        elem.setAttribute("class", "stratum-textbox");
        elem.style.setProperty("position", "absolute");
        const wrapper = new InputWrapper(elem, options);
        this.container.appendChild(elem);
        return wrapper;
    }
}
