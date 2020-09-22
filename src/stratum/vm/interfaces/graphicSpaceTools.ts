import { NumBool } from "../types";

export interface PenTool {
    readonly handle: number;
    readonly color: number;
    readonly width: number;
    readonly style: "SOLID" | "DASH" | "DOT" | "DASHDOT" | "DASHDOTDOT" | "NULL";

    setColor(color: number): NumBool;
    setWidth(width: number): NumBool;
}

export interface BrushTool {
    readonly handle: number;
    readonly color: number;
    readonly fillType: "SOLID" | "NULL" | "PATTERN" | "HATCED";
    readonly bmpTool: BmpTool | undefined;

    setColor(color: number): NumBool;
    setFillType(value: BrushTool["fillType"]): NumBool;
    changeBmpTool(tool: BmpTool | undefined): NumBool;
}

export interface BmpTool {
    readonly handle: number;

    setPixel(x: number, y: number, color: number): NumBool;
    getPixel(x: number, y: number): number;
}

export interface FontTool {
    readonly handle: number;
    readonly name: string;
    readonly size: number;
    readonly bold: boolean;
}

export interface StringTool {
    readonly handle: number;
    readonly text: string;
    setText(value: string): NumBool;
}

export interface TextFragment {
    readonly font: FontTool;
    readonly stringFragment: StringTool;
    readonly foregroundColor: number;
    readonly backgroundColor: number;
}

export interface TextTool {
    readonly handle: number;
    readonly textCount: number;
    readonly assembledText: { text: string; size: number };

    getFragment(index: number): TextFragment;
    updateString(str: StringTool, idx: number): void;
    updateFont(font: FontTool, idx: number): void;
    updateFgColor(color: number, idx: number): void;
    updateBgColor(color: number, idx: number): void;
}

export type GraphicSpaceTool = PenTool | BrushTool | BmpTool | FontTool | StringTool | TextTool;
