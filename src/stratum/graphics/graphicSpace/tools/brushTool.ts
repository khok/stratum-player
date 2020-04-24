import { PartialOptionalData } from "other-types";
import { BrushToolData } from "vdr-types";
import { VmBool } from "vm-interfaces-core";
import { BrushToolState } from "vm-interfaces-gspace";
import { HandleMap } from "~/helpers/handleMap";
import { BitmapTool } from "./bitmapTool";
import { ToolMixin } from "./toolMixin";
import { StratumError } from "~/helpers/errors";

const codeToStyle: { [idx: number]: BrushToolState["fillType"] } = {
    0: "SOLID",
    1: "NULL",
    3: "PATTERN",
};

export type BrushToolOptions = PartialOptionalData<BrushToolData, "hatch" | "rop2">;

export class BrushTool extends ToolMixin<BrushTool> implements BrushToolState {
    private _color: number;
    private _fillType: BrushToolState["fillType"];
    private _bmpTool: BitmapTool | undefined;

    constructor(data: BrushToolOptions, bitmaps?: HandleMap<BitmapTool>) {
        super(data);
        this._color = data.color;
        this._fillType = codeToStyle[data.style] || "HATCED";
        if (this._fillType === "HATCED") console.warn(`Стиль заливки HATCED не реализован`);
        if (data.dibHandle) {
            const bmp = bitmaps && bitmaps.get(data.dibHandle);
            if (!bmp) throw new StratumError(`Инструмент Кисть ${data.dibHandle} не существует`);
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

    setColor(value: number): VmBool {
        this._color = value;
        this.dispatchChanges();
        return 1;
    }

    setFillType(value: BrushToolState["fillType"]): VmBool {
        this._fillType = value;
        this.dispatchChanges();
        return 1;
    }

    changeBmpTool(value: BitmapTool | undefined): VmBool {
        if (this._bmpTool) this._bmpTool.unsubscribe(this);
        if (value) value.subscribe(this, () => this.dispatchChanges());
        this._bmpTool = value;
        this.dispatchChanges();
        return 1;
    }

    unsubFromBitmapTool() {
        if (this.bmpTool) this.bmpTool.unsubscribe(this);
    }
}
