import { fabric } from "fabric";

export class FabricInput extends fabric.Group {
    private iText: fabric.IText;
    constructor(text: string, options: { top?: number; left?: number; width: number; height: number }) {
        const iText = new fabric.IText("Прива", { fontSize: options.height - 3, top: -2, left: 2 });
        super([
            new fabric.Rect({
                ...options,
                height: options.height - 2,
                top: -2,
                fill: "white",
                strokeWidth: 2,
                stroke: "gray"
            }),
            iText
        ]);
        this.iText = iText;
        this.iText.on("changed", e => console.log(e));
    }
    focus(e?: MouseEvent) {
        console.log("focuse");
        this.iText.enterEditing(e);
        // this.iText.hiddenTextarea!.focus();
    }

    setText(text: string) {
        this.iText.text = text;
    }
    getText() {
        return this.iText.text;
    }
}
