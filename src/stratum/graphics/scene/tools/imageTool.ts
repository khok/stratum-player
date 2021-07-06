import { crefToB, crefToG, crefToR, rgbToCref } from "stratum/common/colorrefParsers";
import { Scene } from "../scene";
import { SceneTool } from "./sceneTool";

export interface ImageToolArgs {
    handle?: number;
}

export type ImageToolImage = CanvasRenderingContext2D;

export class ImageTool extends SceneTool<ImageTool> {
    protected _img: ImageToolImage | null;
    protected _imgVer = 0;

    constructor(scene: Scene, img: ImageToolImage | null, { handle }: ImageToolArgs = {}) {
        super(scene, handle);
        this._img = img;
    }

    img(): ImageToolImage | null {
        return this._img;
    }

    width(): number {
        return this._img?.canvas.width ?? 0;
    }

    height(): number {
        return this._img?.canvas.height ?? 0;
    }

    setPixel(x: number, y: number, colorref: number): this {
        if (!this._img) return this;

        const imgData = this._img.createImageData(1, 1);

        const d = imgData.data;
        d[0] = crefToR(colorref);
        d[1] = crefToG(colorref);
        d[2] = crefToB(colorref);
        d[3] = 255;

        this._img.putImageData(imgData, x, y);
        ++this._imgVer;
        this.dispatchChanges();
        return this;
    }

    pixel(x: number, y: number): number {
        if (!this._img) return 0;
        const pixel = this._img.getImageData(x, y, 1, 1).data;
        return rgbToCref(pixel[0], pixel[1], pixel[2], 0);
    }
}
