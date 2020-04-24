import { NormalOmit, PartialOptionalData } from "other-types";
import { BitmapToolData, Point2D } from "vdr-types";
import { VmBool } from "vm-interfaces-core";
import { BitmapToolState } from "vm-interfaces-gspace";
import { ToolMixin } from "./toolMixin";

export type BitmapToolOptions = PartialOptionalData<NormalOmit<BitmapToolData, "image">, "width" | "height">;

export class BitmapTool extends ToolMixin<BitmapTool> implements BitmapToolState {
    private _image?: HTMLImageElement;
    readonly dimensions?: Point2D;
    constructor(data: BitmapToolOptions) {
        super(data);
        this.dimensions = data.width && data.height ? { x: data.width, y: data.height } : undefined;
    }

    get image() {
        return this._image;
    }

    set image(value) {
        if (!value) return;
        this._image = value;
        this.dispatchChanges();
    }

    setPixel(x: number, y: number, color: number): VmBool {
        throw new Error("Method not implemented.");
        this.dispatchChanges();
    }

    getPixel(x: number, y: number): number {
        throw new Error("Method not implemented.");
    }
}
