import { VmBool } from "vm-interfaces-base";
import { BitmapToolState } from "vm-interfaces-graphics";
import { ToolMixin } from "./toolMixin";
import { ImageResolver } from "internal-graphic-types";
import { BitmapToolData, ExternalBitmapToolData } from "data-types-graphics";

export class BitmapTool extends ToolMixin<BitmapTool> implements BitmapToolState {
    readonly type = "ttDIB2D";
    private _image: HTMLImageElement;
    constructor(data: BitmapToolData | ExternalBitmapToolData, imgLoader: ImageResolver) {
        super();
        this._image = data.type === "ttDIB2D" ? imgLoader.fromData(data.image) : imgLoader.fromFile(data.filename);
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
