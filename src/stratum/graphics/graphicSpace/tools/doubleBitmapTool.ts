import { DoubleBitmapToolState } from "vm-interfaces-graphics";
import { ToolMixin } from "./toolMixin";

export class DoubleBitmapTool extends ToolMixin<DoubleBitmapTool> implements DoubleBitmapToolState {
    readonly type = "ttDOUBLEDIB2D";
    private _image: HTMLImageElement;
    constructor(image: HTMLImageElement) {
        super();
        this._image = image;
    }
    get image() {
        return this._image;
    }
    set image(value) {
        this._image = value;
        this.dispatchChanges();
    }
}
