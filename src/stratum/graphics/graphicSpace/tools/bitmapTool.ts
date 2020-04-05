import { VmBool } from "vm-interfaces-base";
import { BitmapToolState } from "vm-interfaces-graphics";
import { ToolMixin } from "./toolMixin";

export class BitmapTool extends ToolMixin<BitmapTool> implements BitmapToolState {
    readonly type = "ttDIB2D";
    private _image: HTMLImageElement;
    public dimensions: { width: number; height: number };
    constructor(data: { image: HTMLImageElement; width: number; height: number }) {
        super();
        this._image = data.image;
        this.dimensions = { width: data.width, height: data.height };
    }
    get image() {
        return this._image;
    }
    set image(value) {
        this._image = value;
        this.dispatchChanges();
    }
    setPixel(x: number, y: number, color: string): VmBool {
        throw new Error("Method not implemented.");
        this.dispatchChanges();
    }
    getPixel(x: number, y: number): string {
        throw new Error("Method not implemented.");
    }
}
