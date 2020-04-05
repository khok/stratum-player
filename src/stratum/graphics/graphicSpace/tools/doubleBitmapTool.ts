import { DoubleBitmapToolState } from "vm-interfaces-graphics";
import { ToolMixin } from "./toolMixin";

export class DoubleBitmapTool extends ToolMixin<DoubleBitmapTool> implements DoubleBitmapToolState {
    readonly type = "ttDOUBLEDIB2D";
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
}
