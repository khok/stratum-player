import { PenToolParams } from "stratum/fileFormats/vdr";
import { Optional, Remove } from "stratum/helpers/utilityTypes";
import { PenTool } from "stratum/vm/interfaces/graphicSpaceTools";
import { NumBool } from "stratum/vm/types";
import { SceneToolMixin } from "./sceneToolMixin";

export type ScenePenToolArgs = Optional<Remove<PenToolParams, "type">, "rop2">;

export class ScenePenTool extends SceneToolMixin implements PenTool {
    private _color: number;
    private _width: number;
    private _style: PenTool["style"];

    constructor(args: ScenePenToolArgs) {
        super(args);
        this._color = args.color;
        this._width = args.width;
        this._style = args.style === 5 ? "NULL" : "SOLID";
    }

    get color() {
        return this._color;
    }

    get width() {
        return this._width;
    }

    get style() {
        return this._style;
    }

    setColor(value: number): NumBool {
        this._color = value;
        this.dispatchChanges();
        return 1;
    }

    setWidth(value: number): NumBool {
        this._width = value;
        this.dispatchChanges();
        return 1;
    }
}
