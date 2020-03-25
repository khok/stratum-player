import { DoubleBitmapToolState } from "vm-interfaces-graphics";
import { ToolMixin } from "./toolMixin";
import { DoubleBitmapToolData, ExternalBitmapToolData } from "data-types-graphics";
import { ImageResolver } from "internal-graphic-types";

export class DoubleBitmapTool extends ToolMixin<DoubleBitmapTool> implements DoubleBitmapToolState {
    static create(data: DoubleBitmapToolData | ExternalBitmapToolData, imgLoader: ImageResolver) {
        //prettier-ignore
        const image = data.type === "ttDOUBLEDIB2D" ? imgLoader.fromBase64(data.image, "png") : imgLoader.fromIconUrl(data.filename);
        return new DoubleBitmapTool(image);
    }

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
