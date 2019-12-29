import { BrushToolState } from "vm-interfaces-graphics";
import { BrushToolData, StringColor } from "data-types-graphics";
import { ToolMixin } from "./toolMixin";

export class BrushTool extends ToolMixin<BrushTool> implements BrushToolState {
    readonly type = "ttBRUSH2D";
    private _color: StringColor;
    constructor(data: BrushToolData) {
        super();
        this._color = data.color;
    }
    get color() {
        return this._color;
    }
    set color(value) {
        this._color = value;
        this.dispatchChanges();
    }
}
