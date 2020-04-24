import { PartialOptionalData } from "other-types";
import { PenToolData } from "vdr-types";
import { VmBool } from "vm-interfaces-core";
import { PenToolState } from "vm-interfaces-gspace";
import { ToolMixin } from "./toolMixin";

export type PenToolOptions = PartialOptionalData<PenToolData, "rop2" | "style">;

export class PenTool extends ToolMixin<PenTool> implements PenToolState {
    private _color: number;
    private _width: number;

    constructor(data: PenToolOptions) {
        super(data);
        this._color = data.color;
        this._width = data.width;
    }

    get color() {
        return this._color;
    }

    get width() {
        return this._width;
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
