import { NormalOmit } from "other-types";
import { StringToolData } from "vdr-types";
import { VmBool } from "vm-interfaces-core";
import { StringToolState } from "vm-interfaces-gspace";
import { ToolMixin } from "./toolMixin";

export type StringToolOptions = NormalOmit<StringToolData, "type">;

export class StringTool extends ToolMixin<StringTool> implements StringToolState {
    private _text: string;

    constructor(data: StringToolOptions) {
        super(data);
        this._text = data.text;
    }

    get text(): string {
        return this._text;
    }

    setText(value: string): VmBool {
        this._text = value;
        this.dispatchChanges();
        return 1;
    }
}
