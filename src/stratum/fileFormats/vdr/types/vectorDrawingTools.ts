import { DibToolImage } from "stratum/helpers/types";

interface ToolBase {
    handle: number;
}

export interface BrushToolParams extends ToolBase {
    type: "ttBRUSH2D";
    color: number;
    style: number;
    hatch: number;
    rop2: number;
    dibHandle: number;
}

export interface PenToolParams extends ToolBase {
    type: "ttPEN2D";
    color: number;
    style: number;
    width: number;
    rop2: number;
}

export interface FontToolParams extends ToolBase {
    type: "ttFONT2D";
    height: number;
    width: number;
    escapement: number;
    orientation: number;
    weight: number;
    italic: number;
    underline: number;
    strikeOut: number;
    charSet: number;
    outPrecision: number;
    clipPrecision: number;
    quality: number;
    pitchAndFamily: number;
    fontName: string;
    size: number;
    style: number;
}

export interface StringToolParams extends ToolBase {
    type: "ttSTRING2D";
    text: string;
}

export interface TextToolFragment {
    fgColor: number;
    bgColor: number;
    fontHandle: number;
    stringHandle: number;
}

export interface TextToolParams extends ToolBase {
    type: "ttTEXT2D";
    textCollection: TextToolFragment[];
}

export interface DibToolParams extends ToolBase {
    type: "ttDIB2D";
    img: DibToolImage;
}

export interface DoubleDibToolParams extends ToolBase {
    type: "ttDOUBLEDIB2D";
    img: DibToolImage;
}

export interface ExternalDibToolParams extends ToolBase {
    type: "ttREFTODIB2D";
    filename: string;
}

export interface ExternalDoubleDibToolParams extends ToolBase {
    type: "ttREFTODOUBLEDIB2D";
    filename: string;
}

export type ImageToolParams = DibToolParams | DoubleDibToolParams | ExternalDibToolParams | ExternalDoubleDibToolParams;
export type VectorDrawingToolParams = BrushToolParams | PenToolParams | FontToolParams | StringToolParams | TextToolParams | ImageToolParams;
