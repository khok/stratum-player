import { ImageElement2D } from "stratum/graphics/scene/elements/imageElement2d";
import { InputElement2D } from "stratum/graphics/scene/elements/inputElement2d";
import { LineElement2D } from "stratum/graphics/scene/elements/lineElement2d";
import { TextElement2D } from "stratum/graphics/scene/elements/textElement2d";
import { Scene, SceneArgs } from "stratum/graphics/scene/scene";
import { BrushSVG } from "stratum/graphics/scene/svg/brushSVG";
import { FontSVG } from "stratum/graphics/scene/svg/fontSVG";
import { ImageSVG } from "stratum/graphics/scene/svg/imageSVG";
import { InputSVG } from "stratum/graphics/scene/svg/inputSVG";
import { LineSVG } from "stratum/graphics/scene/svg/lineSVG";
import { PenSVG } from "stratum/graphics/scene/svg/penSVG";
import { RendererSVG } from "stratum/graphics/scene/svg/rendererSVG";
import { TextSVG } from "stratum/graphics/scene/svg/textSVG";
import { BrushTool } from "stratum/graphics/scene/tools/brushTool";
import { FontTool } from "stratum/graphics/scene/tools/fontTool";
import { ImageTool } from "stratum/graphics/scene/tools/imageTool";
import { PenTool } from "stratum/graphics/scene/tools/penTool";
import { StringTool } from "stratum/graphics/scene/tools/stringTool";
import { TextTool } from "stratum/graphics/scene/tools/textTool";

export interface SceneConstructor {
    new (args?: SceneArgs): Scene;
}

export interface LineElement2DConstructor {
    new (...args: ConstructorParameters<typeof LineElement2D>): LineElement2D;
}

export interface BMPElement2DConstructor {
    new (...args: ConstructorParameters<typeof ImageElement2D>): ImageElement2D;
}

export interface TextElement2DConstructor {
    new (...args: ConstructorParameters<typeof TextElement2D>): TextElement2D;
}

export interface InputElement2DConstructor {
    new (...args: ConstructorParameters<typeof InputElement2D>): InputElement2D;
}

export interface PenToolConstructor {
    new (...args: ConstructorParameters<typeof PenTool>): PenTool;
}

export interface BrushToolConstructor {
    new (...args: ConstructorParameters<typeof BrushTool>): BrushTool;
}

export interface ImageToolConstructor {
    new (...args: ConstructorParameters<typeof ImageTool>): ImageTool;
}

export interface FontToolConstructor {
    new (...args: ConstructorParameters<typeof FontTool>): FontTool;
}

export interface StringToolConstructor {
    new (...args: ConstructorParameters<typeof StringTool>): StringTool;
}

export interface TextToolConstructor {
    new (...args: ConstructorParameters<typeof TextTool>): TextTool;
}

export interface ToolsAndElementsConstructors {
    line: LineElement2DConstructor;
    bitmap: BMPElement2DConstructor;
    text: TextElement2DConstructor;
    input: InputElement2DConstructor;

    pen: PenToolConstructor;
    brush: BrushToolConstructor;
    dib: ImageToolConstructor;
    font: FontToolConstructor;
    str: StringToolConstructor;
    ttool: TextToolConstructor;

    scene: SceneConstructor;
}

export const graphicsImpl: ToolsAndElementsConstructors = {
    pen: PenSVG,
    brush: BrushSVG,
    dib: ImageTool,
    font: FontSVG,
    str: StringTool,
    ttool: TextTool,

    line: LineSVG,
    bitmap: ImageSVG,
    text: TextSVG,
    input: InputSVG,

    scene: RendererSVG,
};
