import { InputElement2D, InputElement2DArgs } from "../elements/inputElement2d";
import { Scene } from "../scene";
import { RendererSVG } from "./rendererSVG";

export class InputSVG extends InputElement2D {
    _svg: false = false; // SVGForeignObjectElement = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    _html: HTMLInputElement = document.createElement("input");
    private st = this._html.style;

    private prevVisible = true;
    private prevOx = 0;
    private prevOy = 0;
    private prevWidth = 0;
    private prevHeight = 0;

    constructor(scene: Scene, args: InputElement2DArgs = {}) {
        super(scene, args);
        const input = this._html;
        // input.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        input.setAttribute("type", "text");
        input.setAttribute("class", "stratum-textbox");
        this.st.setProperty("position", "absolute");
        // input.style.setProperty("left", this.lastX + "px");
        // input.style.setProperty("top", this.lastY + "px");
        // input.style.setProperty("width", width + "px");
        // input.style.setProperty("height", height + "px");
        input.value = args.text ?? "";
        // input.hidden = this.lastHidden;
        input.addEventListener("input", this);
        input.addEventListener("focus", this);
        input.addEventListener("blur", this);
        // this._svg.appendChild(input);
    }

    handleEvent(evt: Event): void {
        (this.scene as RendererSVG)._dispatchInputEvent(this, evt);
    }

    text(): string {
        return this._html.value;
    }
    setText(text: string): this {
        this._html.value = text;
        return this;
    }

    render(): void {
        const visible = this.visib.visible();
        if (this.prevVisible !== visible) {
            this.prevVisible = visible;
            if (visible) {
                this.st.removeProperty("display");
            } else {
                this.st.setProperty("display", "none");
            }
        }
        if (!visible) return;

        const ox = this._x - this.scene._offsetX;
        if (ox !== this.prevOx) {
            this.prevOx = ox;
            this.st.setProperty("left", ox.toString() + "px");
        }
        const oy = this._y - this.scene._offsetY;
        if (oy !== this.prevOy) {
            this.prevOy = oy;
            this.st.setProperty("top", oy.toString() + "px");
        }
        const w = this._width;
        if (this.prevWidth !== w) {
            this.prevWidth = w;
            this.st.setProperty("width", w.toString() + "px");
        }
        const h = this._height;
        if (this.prevHeight !== h) {
            this.prevHeight = h;
            this.st.setProperty("height", h.toString() + "px");
        }
    }
}
