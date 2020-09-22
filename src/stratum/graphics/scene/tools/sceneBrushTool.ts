import { HandleMap } from "~/helpers/handleMap";
import { Optional, Remove } from "~/helpers/utilityTypes";
import { BrushToolParams } from "~/common/fileFormats/vdr/types/vectorDrawingTools";
import { BrushTool } from "~/vm/interfaces/graphicSpaceTools";
import { NumBool } from "~/vm/types";
import { SceneBmpTool } from ".";
import { SceneToolMixin } from "./sceneToolMixin";

const codeToStyle: { [idx: number]: BrushTool["fillType"] } = {
    0: "SOLID",
    1: "NULL",
    2: "HATCED",
    3: "PATTERN",
};

export type SceneBrushToolArgs = Optional<Remove<BrushToolParams, "type">, "hatch" | "rop2">;

export class SceneBrushTool extends SceneToolMixin implements BrushTool {
    private _color: number;
    private _fillType: BrushTool["fillType"];
    private _bmpTool: SceneBmpTool | undefined;

    constructor(args: SceneBrushToolArgs, bitmaps?: HandleMap<SceneBmpTool>) {
        super(args);
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

    get color() {
        return this._color;
    }

    get fillType() {
        return this._fillType;
    }

    get bmpTool() {
        return this._bmpTool;
    }

    setColor(value: number): NumBool {
        this._color = value;
        this.dispatchChanges();
        return 1;
    }

    setFillType(value: BrushTool["fillType"]): NumBool {
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
