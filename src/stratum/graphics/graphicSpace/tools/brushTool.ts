import { BrushToolState } from "vm-interfaces-graphics";
import { StringColor } from "data-types-graphics";
import { ToolMixin } from "./toolMixin";
import { BitmapTool } from "./bitmapTool";

const codeToStyle: { [idx: number]: BrushToolState["fillType"] } = {
    0: "SOLID",
    1: "NULL",
    3: "PATTERN"
};

export class BrushTool extends ToolMixin<BrushTool> implements BrushToolState {
    readonly type = "ttBRUSH2D";
    private _color: StringColor;
    private _fillType: BrushToolState["fillType"];
    private _bmpTool?: BitmapTool;
    constructor(color: StringColor, style: number, bmpTool?: BitmapTool) {
        super();
        this._color = color;
        this._fillType = codeToStyle[style] || "HATCED";
        if (this._fillType === "HATCED") console.warn(`Стиль заливки HATCED не реализован`);
        if (bmpTool) bmpTool.subscribe(this, b => (this.bmpTool = b));
        this._bmpTool = bmpTool;
    }
    get bmpTool() {
        return this._bmpTool;
    }
    set bmpTool(value) {
        this._bmpTool = value;
        this.dispatchChanges();
    }
    get color() {
        return this._color;
    }
    set color(value) {
        this._color = value;
        this.dispatchChanges();
    }
    get fillType() {
        return this._fillType;
    }
    set fillType(value) {
        this._fillType = value;
        this.dispatchChanges();
    }
}
