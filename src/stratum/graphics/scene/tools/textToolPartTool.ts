import { rgbToCref } from "stratum/common/colorrefParsers";
import { ToolKeeperComponent } from "../components/toolKeeperComponent";
import { Scene } from "../scene";
import { FontTool } from "./fontTool";
import { SceneTool } from "./sceneTool";
import { StringTool } from "./stringTool";

export interface TextToolPartToolArgs {
    handle?: number;
    fgColor?: number;
    bgColor?: number;
}

export class TextToolPartTool extends SceneTool<TextToolPartTool> {
    protected _fgColor: number;
    protected _fgColorVer = 0;
    protected _bgColor: number;
    protected _bgColorVer = 0;

    readonly font: ToolKeeperComponent<FontTool>;
    readonly str: ToolKeeperComponent<StringTool>;

    constructor(scene: Scene, font: FontTool, str: StringTool, { handle, bgColor, fgColor }: TextToolPartToolArgs = {}) {
        super(scene, handle);
        this._fgColor = fgColor ?? 0;
        this._bgColor = bgColor ?? rgbToCref(0, 0, 0, 1); //transparent
        this.font = new ToolKeeperComponent(scene, font);
        this.str = new ToolKeeperComponent(scene, str);
    }

    fgColor(): number {
        return this._fgColor;
    }

    setFgColor(color: number): this {
        this._fgColor = color;
        ++this._fgColorVer;
        this.dispatchChanges();
        return this;
    }

    bgColor(): number {
        return this._bgColor;
    }

    setBgColor(color: number): this {
        this._bgColor = color;
        ++this._bgColorVer;
        this.dispatchChanges();
        return this;
    }
}
