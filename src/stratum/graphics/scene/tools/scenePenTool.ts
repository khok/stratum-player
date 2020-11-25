import { PenToolParams } from "stratum/fileFormats/vdr";
import { Remove } from "stratum/helpers/utilityTypes";
import { NumBool } from "stratum/translator";
import { SceneToolMixin } from "./sceneToolMixin";

export type ScenePenToolArgs = Remove<PenToolParams, "type">;

export class ScenePenTool extends SceneToolMixin {
    private _color: number;
    private _width: number;
    private _rop2: number;
    private _style2: number;
    private _style: "SOLID" | "DASH" | "DOT" | "DASHDOT" | "DASHDOTDOT" | "NULL";

    constructor(args: ScenePenToolArgs) {
        super(args);
        this._color = args.color;
        this._width = args.width;
        this._rop2 = args.rop2;
        this._style = args.style === 5 ? "NULL" : "SOLID";
        this._style2 = args.style;
    }

    get rop() {
        return this._rop2;
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

    get style2() {
        return this._style2;
    }

    setStyle(style: number): NumBool {
        this._style2 = style;
        this._style = style === 5 ? "NULL" : "SOLID";
        return 1;
    }

    setRop(rop: number): NumBool {
        this._rop2 = rop;
        return 1;
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
