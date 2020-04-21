import { HtmlTextInputWrapper, HtmlTextInputWrapperOptions, HTMLInputElementsFactory } from "html-types";

class HtmlInput implements HtmlTextInputWrapper {
    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;
    hidden: boolean = false;
    private inp: HTMLInputElement;
    constructor(root: HTMLElement, options: HtmlTextInputWrapperOptions) {
        this.inp = document.createElement("input");
        this.inp.setAttribute("type", "text");
        this.inp.setAttribute("style", "position:absolute;");
        // <input id="test_input" type="text" style="position:absolute;left:100px;top:300px;width:600px;" value="Hello" />
        this.set(options);
        root.appendChild(this.inp);
    }
    private updateValues() {
        this.inp.style.setProperty("left", this.x.toString());
        this.inp.style.setProperty("top", this.y.toString());
        this.inp.style.setProperty("width", (this.width + 1).toString());
        this.inp.style.setProperty("height", (this.height + 1).toString());
        this.inp.hidden = this.hidden;
        this.inp.value = this.text;
    }
    set(options: HtmlTextInputWrapperOptions) {
        Object.assign(this, options);
        this.updateValues();
        return this;
    }
    get text(): string {
        return this.inp.value;
    }
    set text(value) {
        this.inp.value = value;
    }
    destroy() {
        this.inp.remove();
    }
    onChange(fn: () => void) {
        this.inp.addEventListener("input", fn);
    }
}

export class HtmlFactory implements HTMLInputElementsFactory {
    constructor(private root: HTMLElement) {}
    createTextInput(options: HtmlTextInputWrapperOptions): HtmlTextInputWrapper {
        return new HtmlInput(this.root, options);
    }
}
