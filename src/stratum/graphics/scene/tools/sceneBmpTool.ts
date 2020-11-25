import { BmpToolParams } from "stratum/fileFormats/vdr";
import { BadDataError } from "stratum/helpers/errors";
import { Point2D } from "stratum/helpers/types";
import { Optional, Remove } from "stratum/helpers/utilityTypes";
import { NumBool } from "stratum/translator";
import { SceneToolMixin } from "./sceneToolMixin";

export type SceneBmpToolArgs = Optional<Remove<BmpToolParams, "type" | "base64Image">, "width" | "height"> & { image?: HTMLImageElement };

export class SceneBmpTool extends SceneToolMixin {
    private _image?: HTMLImageElement;
    readonly size?: Point2D;
    private asyncLoaded: boolean;
    constructor(args: SceneBmpToolArgs) {
        super(args);
        this.size = args.width && args.height ? { x: args.width, y: args.height } : undefined;
        this._image = args.image;
        this.asyncLoaded = !args.image;
    }

    get image() {
        return this._image;
    }

    setImage(value: HTMLImageElement) {
        this._image = value;
        this.dispatchChanges();
    }

    setPixel(x: number, y: number, color: number): NumBool {
        if (this.asyncLoaded) throw new BadDataError(`Изображение #${this.handle} было загружено асинхронно`);
        throw new Error("Method not implemented.");
        this.dispatchChanges();
    }

    getPixel(x: number, y: number): number {
        throw new Error("Method not implemented.");
    }
}
