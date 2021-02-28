export interface InputWrapperOptions {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    hidden: boolean;
}

export class InputWrapper {
    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;
    hidden: boolean = false;

    private elem: HTMLInputElement;
    constructor(root: HTMLElement, opts: InputWrapperOptions) {
        const elem = (this.elem = document.createElement("input"));
        elem.setAttribute("type", "text");
        elem.setAttribute("class", "stratum-textbox");
        elem.style.setProperty("position", "absolute");
        this.setOrigin(opts.x, opts.y);
        this.setSize(opts.width, opts.height);
        this.setText(opts.text);
        this.setHidden(opts.hidden);
        root.appendChild(elem);
    }

    setOrigin(x: number, y: number) {
        this.elem.style.setProperty("left", x + "px");
        this.elem.style.setProperty("top", y + "px");
    }
    setSize(width: number, height: number) {
        this.elem.style.setProperty("width", width + "px");
        this.elem.style.setProperty("height", height + "px");
    }
    setHidden(hidden: boolean) {
        this.elem.hidden = hidden;
    }

    text(): string {
        return this.elem.value;
    }
    setText(text: string) {
        this.elem.value = text;
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
