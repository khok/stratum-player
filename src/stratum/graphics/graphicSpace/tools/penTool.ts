import { PenToolData } from "data-types-graphics";
import { PenToolState } from "vm-interfaces-graphics";
import { ToolMixin } from "./toolMixin";

export class PenTool extends ToolMixin<PenTool> implements PenToolState {
    readonly type = "ttPEN2D";
    private _color: string;
    private _width: number;
    constructor(data: PenToolData) {
        super();
        this._color = data.color;
        this._width = data.width;
    }
    get color() {
        return this._color;
    }
    get width() {
        return this._width;
    }
    set color(value) {
        this._color = value;
        this.dispatchChanges();
    }
    set width(value) {
        this._width = value;
        this.dispatchChanges();
    }
}
