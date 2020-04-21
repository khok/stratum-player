import { BrushToolState } from "vm-interfaces-gspace";
import { ToolMixin } from "./toolMixin";
import { BitmapTool } from "./bitmapTool";

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
        this.bmpTool = bmpTool;
    }
    get bmpTool() {
        return this._bmpTool;
    }
    set bmpTool(value) {
        if (this._bmpTool) this._bmpTool.unsubscribe(this);
        if (value) value.subscribe(this, () => this.dispatchChanges());
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
    unsubFromBitmapTool() {
        this.bmpTool = undefined;
    }
}
