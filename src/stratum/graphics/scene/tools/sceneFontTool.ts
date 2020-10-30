import { FontToolParams } from "stratum/fileFormats/vdr";
import { Remove, Require } from "stratum/helpers/utilityTypes";
import { FontTool } from "stratum/vm/interfaces/graphicSpaceTools";
import { SceneToolMixin } from "./sceneToolMixin";

export type SceneFontToolArgs = Require<Partial<Remove<FontToolParams, "type">>, "handle" | "fontName" | "size">;

export class SceneFontTool extends SceneToolMixin implements FontTool {
    private _name: string;
    private _size: number;
    private _bold: boolean;

    constructor(args: SceneFontToolArgs) {
        super(args);
        //тому что шрифта "Arial Cyr" в браузерах нет, обойдем это.
        this._name = args.fontName.toLowerCase().startsWith("arial") ? "Arial" : args.fontName;
        this._size = -(args.height || 0) || args.size;
        this._bold = !!args.weight;
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
