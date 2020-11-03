export interface InputWrapperOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    text?: string;
    hidden?: boolean;
}

export class InputWrapper {
    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;
    hidden: boolean = false;

    constructor(private elem: HTMLInputElement, opts: InputWrapperOptions) {
        this.set(opts);
    }

    private updateValues() {
        const { elem, x, y, width, height, hidden, text } = this;
        elem.style.setProperty("left", x + "px");
        elem.style.setProperty("top", y + "px");
        elem.style.setProperty("width", width + "px");
        elem.style.setProperty("height", height + "px");
        elem.hidden = hidden;
        elem.value = text;
    }

    set(options: InputWrapperOptions) {
        Object.assign(this, options);
        this.updateValues();
        return this;
    }

    get text(): string {
        return this.elem.value;
    }

    set text(value) {
        this.elem.value = value;
    }

    destroy() {
        this.elem.remove();
    }

    onEdit(handler: () => void) {
        this.elem.addEventListener("input", handler);
    }

    offEdit(handler: () => void) {
        this.elem.removeEventListener("input", handler);
    }
}
