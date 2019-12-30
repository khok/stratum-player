import { FontToolState } from "vm-interfaces-graphics";
import { ToolMixin } from "./toolMixin";

export class FontTool extends ToolMixin<FontTool> implements FontToolState {
    readonly type = "ttFONT2D";
    private _name: string;
    private _size: number;
    private _style: number;
    constructor(name: string, size: number, style: number) {
        super();
        this._name = name;
        this._size = size || 18; //исправляем дурацкие баги стратума
        this._style = style;
    }
    get name(): string {
        return this._name;
    }
    get size(): number {
        return this._size;
    }
    get style(): number {
        return this._style;
    }
    set name(value) {
        this._name = value;
        this.dispatchChanges();
    }
    set size(value) {
        this._size = value;
        this.dispatchChanges();
    }
    set style(value) {
        this._style = value;
        this.dispatchChanges();
    }
}
