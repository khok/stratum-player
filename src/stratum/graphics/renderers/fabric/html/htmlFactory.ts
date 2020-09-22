export interface HtmlInputWrapperOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    text?: string;
    hidden?: boolean;
}

/**
 * Обертка над обычным текстовым полем
 */
export class HtmlInputWrapper {
    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;
    hidden: boolean = false;
    private element: HTMLInputElement;
    constructor(root: HTMLElement, opts: HtmlInputWrapperOptions) {
        this.element = document.createElement("input");
        this.element.setAttribute("type", "text");
        this.element.setAttribute("style", "position:absolute;");
        // <input id="test_input" type="text" style="position:absolute;left:100px;top:300px;width:600px;" value="Hello" />
        this.set(opts);
        root.appendChild(this.element);
    }
    private updateValues() {
        this.element.style.setProperty("left", this.x.toString());
        this.element.style.setProperty("top", this.y.toString());
        this.element.style.setProperty("width", (this.width + 1).toString());
        this.element.style.setProperty("height", (this.height + 1).toString());
        this.element.hidden = this.hidden;
        this.element.value = this.text;
    }
    set(options: HtmlInputWrapperOptions) {
        Object.assign(this, options);
        this.updateValues();
        return this;
    }
    get text(): string {
        return this.element.value;
    }
    set text(value) {
        this.element.value = value;
    }
    destroy() {
        this.element.remove();
    }
    onChange(fn: () => void) {
        this.element.addEventListener("input", fn);
    }
}

export class HtmlElementsFactory {
    constructor(private root: HTMLElement) {}
    createTextInput(options: HtmlInputWrapperOptions): HtmlInputWrapper {
        return new HtmlInputWrapper(this.root, options);
    }
}
