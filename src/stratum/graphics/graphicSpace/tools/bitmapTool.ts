import { VmBool } from "vm-interfaces-base";
import { BitmapToolState } from "vm-interfaces-gspace";
import { ToolMixin } from "./toolMixin";
import { Point2D } from "data-types-graphics";

export class BitmapTool extends ToolMixin<BitmapTool> implements BitmapToolState {
    private _image?: HTMLImageElement;
    constructor(public dimensions?: Point2D) {
        super();
    }
    get image() {
        return this._image;
    }
    set image(value) {
        if (!value) return;
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
