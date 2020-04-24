import { PartialRequiredData } from "other-types";
import { FontToolData } from "vdr-types";
import { FontToolState } from "vm-interfaces-gspace";
import { ToolMixin } from "./toolMixin";

export type FontToolOptions = PartialRequiredData<FontToolData, "handle" | "fontName" | "size">;

export class FontTool extends ToolMixin<FontTool> implements FontToolState {
    private _name: string;
    private _size: number;
    private _bold: boolean;

    constructor(data: FontToolOptions) {
        super(data);
        //тому что шрифта "Arial Cyr" в браузерах нет, обойдем это.
        this._name = data.fontName.toLowerCase().startsWith("arial") ? "Arial" : data.fontName;
        // this._size = size || 18; //исправляем дурацкие баги стратума
        this._size = -(data.height || 0) || data.size;
        this._bold = !!data.weight;
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
}
