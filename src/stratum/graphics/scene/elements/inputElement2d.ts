import { ToolKeeperComponent } from "../components/toolKeeperComponent";
import { VisibilityComponent } from "../components/visibilityComponent";
import { Scene } from "../scene";
import { FontTool } from "../tools/fontTool";
import { Element2D, Element2DArgs } from "./element2d";

export interface InputElement2DArgs extends Element2DArgs {
    visib?: VisibilityComponent;
    text?: string;
    font?: FontTool;
}

export abstract class InputElement2D extends Element2D {
    readonly type = "input";
    readonly visib: VisibilityComponent;
    readonly font: ToolKeeperComponent<FontTool | null>;

    constructor(scene: Scene, args: InputElement2DArgs = {}) {
        super(scene, args);
        this.visib = args.visib ?? new VisibilityComponent(scene, true, 0);
        this.font = new ToolKeeperComponent(scene, args.font ?? null);
    }

    abstract text(): string;
    abstract setText(text: string): this;
}
