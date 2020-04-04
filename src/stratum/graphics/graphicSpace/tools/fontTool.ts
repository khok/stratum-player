import { FontToolState } from "vm-interfaces-graphics";
import { ToolMixin } from "./toolMixin";

export type FontToolOptions = {
    fontName: string;
    size: number;
    style: number;
    weight?: number;
};

export class FontTool extends ToolMixin<FontTool> implements FontToolState {
    readonly type = "ttFONT2D";
    private _name: string;
    private _size: number;
    private _style: number;
    private _weight: number;
    constructor({ fontName, size, style, weight }: FontToolOptions) {
        super();
        this._name = fontName;
        this._size = size || 18; //исправляем дурацкие баги стратума
        this._style = style;
        this._weight = weight || 0;
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
    get weight(): number {
        return this._weight;
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
    set weight(value) {
        this._weight = value;
        this.dispatchChanges();
    }
}
