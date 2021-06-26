import { BrushComponent, BrushComponentArgs } from "./components/brushComponent";
import { PenComponent, PenComponentArgs } from "./components/penComponent";

export interface ToolFactory {
    pen(args: PenComponentArgs): PenComponent;
    brush(args: BrushComponentArgs): BrushComponent;
}
