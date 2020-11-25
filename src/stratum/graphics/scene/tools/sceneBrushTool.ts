import { BrushToolParams } from "stratum/fileFormats/vdr";
import { HandleMap } from "stratum/helpers/handleMap";
import { Remove } from "stratum/helpers/utilityTypes";
import { NumBool } from "stratum/translator";
import { SceneBmpTool } from ".";
import { SceneToolMixin } from "./sceneToolMixin";

type FillType = "SOLID" | "NULL" | "PATTERN" | "HATCED";
const codeToStyle: { [idx: number]: FillType } = {
    0: "SOLID",
    1: "NULL",
    2: "HATCED",
    3: "PATTERN",
};

export type SceneBrushToolArgs = Remove<BrushToolParams, "type">;

export class SceneBrushTool extends SceneToolMixin {
    private _color: number;
    private _fillType: FillType;
    private _bmpTool: SceneBmpTool | undefined;

    private _style: number;
    private _hatch: number;
    private _rop: number;

    constructor(args: SceneBrushToolArgs, bitmaps?: HandleMap<SceneBmpTool>) {
        super(args);
        this._style = args.style;
        this._hatch = args.hatch;
        this._rop = args.rop2;
        this._color = args.color;
        this._fillType = codeToStyle[args.style];

        if (this._fillType === "HATCED") console.warn(`Стиль заливки HATCED не реализован`);
        else if (!this._fillType) console.warn(`Неизвестный тип заливки: ${args.style}`);

        if (args.dibHandle) {
            const bmp = bitmaps && bitmaps.get(args.dibHandle);
            // if (!bmp) throw new NoSuchToolError("Битовая карта", args.dibHandle, "Инструмент 'Кисть'", this.handle);
            this.changeBmpTool(bmp);
        }
    }

    get style(): number {
        return this._style;
    }
    get hatch(): number {
        return this._hatch;
    }
    get rop(): number {
        return this._rop;
    }

    get color() {
        return this._color;
    }

    get fillType() {
        return this._fillType;
    }

    get bmpTool() {
        return this._bmpTool;
    }

    setRop(rop: number): NumBool {
        this._rop = rop;
        return 1;
    }
    setHatch(hatch: number): NumBool {
        this._hatch = hatch;
        return 1;
    }
    setStyle(style: number): NumBool {
        this._style = style;
        return 1;
    }

    setColor(value: number): NumBool {
        this._color = value;
        this.dispatchChanges();
        return 1;
    }

    setFillType(value: FillType): NumBool {
        this._fillType = value;
        this.dispatchChanges();
        return 1;
    }

    changeBmpTool(value: SceneBmpTool | undefined): NumBool {
        if (this._bmpTool) this._bmpTool.unsubscribe(this);
        if (value) value.subscribe(this, () => this.dispatchChanges());
        this._bmpTool = value;
        this.dispatchChanges();
        return 1;
    }

    unsubFromBmpTool() {
        if (this.bmpTool) this.bmpTool.unsubscribe(this);
    }
}
