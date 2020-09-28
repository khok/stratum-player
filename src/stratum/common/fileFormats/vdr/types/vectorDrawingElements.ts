import { Point2D } from "stratum/helpers/types";

export interface ElementBase {
    handle: number;
    options: number;
    name: string;
}

export interface Element2dBase extends ElementBase {
    position: Point2D;
    size: Point2D;
}

export interface GroupElement extends ElementBase {
    type: "otGROUP2D";
    childHandles: number[];
}

export interface LineElement extends Element2dBase {
    type: "otLINE2D";
    penHandle: number;
    brushHandle: number;
    points: Point2D[];
    arrows?: Uint8Array;
}

interface BitmapBase extends Element2dBase {
    bmpOrigin: Point2D;
    bmpSize: Point2D;
    bmpAngle: number;
}

export interface BitmapElement extends BitmapBase {
    type: "otBITMAP2D";
    bmpHandle: number;
}

export interface DoubleBitmapElement extends BitmapBase {
    type: "otDOUBLEBITMAP2D";
    bmpHandle: number;
}

export interface TextElement extends Element2dBase {
    type: "otTEXT2D";
    textToolHandle: number;
    delta: number;
    angle: number;
}

export interface ControlElement extends Element2dBase {
    type: "otCONTROL2D";
    classname: "Edit" | "Button" | "ComboBox";
    text: string;
    dwStyle: number;
    exStyle: number;
    id: number;
    controlSize: Point2D;
}

export type VectorDrawingElement2d = LineElement | BitmapElement | DoubleBitmapElement | TextElement | ControlElement;
export type VectorDrawingElement = VectorDrawingElement2d | GroupElement;
