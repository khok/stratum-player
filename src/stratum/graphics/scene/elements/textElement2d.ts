import { ToolKeeperComponent } from "../components/toolKeeperComponent";
import { VisibilityComponent } from "../components/visibilityComponent";
import { Scene } from "../scene";
import { TextTool } from "../tools/textTool";
import { Element2D, Element2DArgs } from "./element2d";

export interface TextElement2DArgs extends Element2DArgs {
    angle?: number;
    visib?: VisibilityComponent;
}

export abstract class TextElement2D extends Element2D {
    readonly type = "text";
    readonly visib: VisibilityComponent;
    readonly tool: ToolKeeperComponent<TextTool>;

    _angle: number;

    constructor(scene: Scene, tool: TextTool, args: TextElement2DArgs = {}) {
        super(scene, args);
        this._angle = args.angle ?? 0;
        this.visib = args.visib ?? new VisibilityComponent(scene, true, 0);
        this.tool = new ToolKeeperComponent(scene, tool);
    }

    angle(): number {
        return this._angle;
    }

    override _rotated(ox: number, oy: number, angle: number): void {
        super._rotated(ox, oy, angle);
        this._angle += angle;
    }

    abstract actualWidth(): number;
    abstract actualHeight(): number;
}
