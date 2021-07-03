import { BrushTool } from "./brushTool";
import { DIBTool } from "./dibTool";
import { FontTool } from "./fontTool";
import { PenTool } from "./penTool";
import { StringTool } from "./stringTool";
import { TextTool } from "./textTool";

export interface ToolStorage {
    readonly pens: ReadonlyMap<number, PenTool>;
    readonly brushes: ReadonlyMap<number, BrushTool>;
    readonly dibs: ReadonlyMap<number, DIBTool>;
    readonly doubleDibs: ReadonlyMap<number, DIBTool>;
    readonly strings: ReadonlyMap<number, StringTool>;
    readonly fonts: ReadonlyMap<number, FontTool>;
    readonly texts: ReadonlyMap<number, TextTool>;
}
