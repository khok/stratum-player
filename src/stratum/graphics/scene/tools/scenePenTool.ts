import { Optional, Remove } from "~/helpers/utilityTypes";
import { PenToolParams } from "~/common/fileFormats/vdr/types/vectorDrawingTools";
import { PenTool } from "~/vm/interfaces/graphicSpaceTools";
import { NumBool } from "~/vm/types";
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
