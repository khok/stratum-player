import { LineElement2D } from "./scene/elements/lineElement2d";
import { Scene, SceneArgs } from "./scene/scene";
import { BrushTool } from "./scene/tools/brushTool";
import { PenTool } from "./scene/tools/penTool";

export interface SceneConstructor {
    new (args: SceneArgs): Scene;
}

export interface LineElement2DConstructor {
    new (...args: ConstructorParameters<typeof LineElement2D>): LineElement2D;
}

export interface PenToolConstructor {
    new (...args: ConstructorParameters<typeof PenTool>): PenTool;
}

export interface BrushToolConstructor {
    new (...args: ConstructorParameters<typeof BrushTool>): BrushTool;
}

export interface ToolsAndElementsConstructors {
    line: LineElement2DConstructor;
    pen: PenToolConstructor;
    brush: BrushToolConstructor;
    scene: SceneConstructor;
}
