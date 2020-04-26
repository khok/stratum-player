import { PartialOptionalData } from "other-types";
import { PenToolData } from "vdr-types";
import { VmBool } from "vm-interfaces-core";
import { PenToolState } from "vm-interfaces-gspace";
import { ToolMixin } from "./toolMixin";

export type PenToolOptions = PartialOptionalData<PenToolData, "rop2">;

export class PenTool extends ToolMixin<PenTool> implements PenToolState {
    private _color: number;
    private _width: number;
    private _style: PenToolState["style"];

    constructor(data: PenToolOptions) {
        super(data);
        this._color = data.color;
        this._width = data.width;
        this._style = data.style === 5 ? "NULL" : "SOLID";
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

    setColor(value: number): VmBool {
        this._color = value;
        this.dispatchChanges();
        return 1;
    }

    setWidth(value: number): VmBool {
        this._width = value;
        this.dispatchChanges();
        return 1;
    }
}
