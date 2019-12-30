import { StringToolState } from "vm-interfaces-graphics";
import { ToolMixin } from "./toolMixin";

export class StringTool extends ToolMixin<StringTool> implements StringToolState {
    readonly type = "ttSTRING2D";
    private _text: string;
    constructor(text: string) {
        super();
        this._text = text;
    }
    get text(): string {
        return this._text;
    }
    set text(value) {
        this._text = value;
        this.dispatchChanges();
    }
}
