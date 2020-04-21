import { FontToolState } from "vm-interfaces-gspace";
import { ToolMixin } from "./toolMixin";

export type FontToolOptions = {
    fontName: string;
    size: number;
    weight?: number;
    height?: number;
};

export class FontTool extends ToolMixin<FontTool> implements FontToolState {
    private _name: string;
    private _size: number;
    private _bold: boolean;
    constructor({ fontName, size, height, weight }: FontToolOptions) {
        super();
        //тому что шрифта "Arial Cyr" в браузерах нет, обойдем это.
        this._name = fontName.toLowerCase().startsWith("arial") ? "Arial" : fontName;
        // this._size = size || 18; //исправляем дурацкие баги стратума
        this._size = -(height || 0) || size;
        this._bold = !!weight;
    }
    get name(): string {
        return this._name;
    }
    get size(): number {
        return this._size;
    }
    get bold(): boolean {
        return this._bold;
    }
    set name(value) {
        this._name = value;
        this.dispatchChanges();
    }
    set size(value) {
        this._size = value;
        this.dispatchChanges();
    }
    set bold(value) {
        this._bold = value;
        this.dispatchChanges();
    }
}
