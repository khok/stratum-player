import { fromUrl } from "~/api";
import { HtmlTextInputWrapper, HtmlTextInputWrapperOptions } from "internal-graphic-types";

class TestInput implements HtmlTextInputWrapper {
    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;
    text: string = "";
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
    destroy() {
        this.inp.remove();
    }
    onChange(fn: () => void) {
        this.inp.addEventListener("input", fn);
    }
}

//Запуск проекта balls_stress_test с использованием api.ts
(async function() {
    const player = await fromUrl(["test_projects/balls_stress_test.zip", "/data/library.zip"]);
    if (!player) return;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const root = document.getElementById("root") as HTMLInputElement;
    player.setGraphicOptions({
        globalCanvas: canvas,
        inputFactory: {
            createTextInput: opts => new TestInput(root, opts)
        }
    });
    setTimeout(() => player.pause(), 5000);
    try {
        await player.play();
    } catch (e) {
        console.error(e);
        return;
    }
    console.log("Тест завершен");
    for (let i = 0; i < 10; i++) {
        await new Promise(res => setTimeout(res, 400));
        player.oneStep();
        console.log("Шаг ", i + 1);
    }
})();
