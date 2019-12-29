import { DoubleBitmapToolState } from "vm-interfaces-graphics";
import { ToolMixin } from "./toolMixin";
import { DoubleBitmapToolData, ExternalBitmapToolData } from "data-types-graphics";
import { ImageResolver } from "internal-graphic-types";

export class DoubleBitmapTool extends ToolMixin<DoubleBitmapTool> implements DoubleBitmapToolState {
    readonly type = "ttDOUBLEDIB2D";
    private _image: HTMLImageElement;
    constructor(data: DoubleBitmapToolData | ExternalBitmapToolData, imgLoader: ImageResolver) {
        super();
        this._image =
            data.type === "ttDOUBLEDIB2D" ? imgLoader.fromData(data.images[0]) : imgLoader.fromFile(data.filename);
    }
    get image() {
        return this._image;
    }
    set image(value) {
        this._image = value;
        this.dispatchChanges();
    }
}
