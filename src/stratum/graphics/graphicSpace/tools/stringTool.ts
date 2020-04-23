import { VmBool } from "vm-interfaces-core";
import { StringToolState } from "vm-interfaces-gspace";
import { ToolMixin } from "./toolMixin";

export class StringTool extends ToolMixin<StringTool> implements StringToolState {
    private _text: string;

    constructor(text: string) {
        super();
        this._text = text;
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
