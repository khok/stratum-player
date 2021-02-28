import { Point2D } from "stratum/helpers/types";

export interface ElementBase {
    handle: number;
    options: number;
    name: string;
}

export interface Element2dBase extends ElementBase {
    originX: number;
    originY: number;
    width: number;
    height: number;
}

export interface GroupElement extends ElementBase {
    type: "otGROUP2D";
    childHandles: number[];
}

export interface LineElement extends Element2dBase {
    type: "otLINE2D";
    penHandle: number;
    brushHandle: number;
    coords: number[];
    arrows?: Uint8Array;
}

interface BitmapBase extends Element2dBase {
    hidden: boolean;
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;
    angle: number;
    dibHandle: number;
}

export interface BitmapElement extends BitmapBase {
    type: "otBITMAP2D";
}

export interface DoubleBitmapElement extends BitmapBase {
    type: "otDOUBLEBITMAP2D";
}

export interface TextElement extends Element2dBase {
    type: "otTEXT2D";
    textToolHandle: number;
    delta: number;
    angle: number;
}

export interface ControlElement extends Element2dBase {
    type: "otCONTROL2D";
    className: "EDIT" | "BUTTON" | "COMBOBOX";
    text: string;
    dwStyle: number;
    exStyle: number;
    id: number;
    controlSize: Point2D;
}

export type VectorDrawingElement2d = LineElement | BitmapElement | DoubleBitmapElement | TextElement | ControlElement;
export type VectorDrawingElement = VectorDrawingElement2d | GroupElement;
