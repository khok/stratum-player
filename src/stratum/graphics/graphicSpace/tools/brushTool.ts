import { VmBool } from "vm-interfaces-core";
import { BrushToolState } from "vm-interfaces-gspace";
import { BitmapTool } from "./bitmapTool";
import { ToolMixin } from "./toolMixin";

const codeToStyle: { [idx: number]: BrushToolState["fillType"] } = {
    0: "SOLID",
    1: "NULL",
    3: "PATTERN",
};

export class BrushTool extends ToolMixin<BrushTool> implements BrushToolState {
    private _color: number;
    private _fillType: BrushToolState["fillType"];
    private _bmpTool: BitmapTool | undefined;

    constructor(color: number, style: number, bmpTool?: BitmapTool) {
        super();
        this._color = color;
        this._fillType = codeToStyle[style] || "HATCED";
        if (this._fillType === "HATCED") console.warn(`Стиль заливки HATCED не реализован`);
        this.changeBmpTool(bmpTool);
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
