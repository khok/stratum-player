import { Scene } from "../scene";
import { FontTool } from "./fontTool";
import { SceneTool } from "./sceneTool";
import { StringTool } from "./stringTool";
import { TextToolPartTool } from "./textToolPartTool";

export interface TextToolArgs {
    handle?: number;
}

export interface TextToolPartData {
    font: FontTool;
    str: StringTool;
    fgColor?: number;
    bgColor?: number;
}

export class TextTool extends SceneTool<TextTool> {
    readonly parts: readonly TextToolPartTool[];
    constructor(scene: Scene, parts: TextToolPartData[], { handle }: TextToolArgs = {}) {
        super(scene, handle);
        this.parts = parts?.map(({ bgColor, fgColor, font, str }) => new TextToolPartTool(scene, font, str, { bgColor, fgColor }));
    }
}
