import { Point2D } from "stratum/helpers/types";

export interface Hyperbase {
    target?: string;
    windowName?: string;
    objectName?: string;
    openMode?: number;
    effect?: string;
    time?: number;
    params?: string;
    disabled?: boolean;
}

export interface ElementBase {
    handle: number;
    options: number;
    name?: string;
    hyperbase?: Hyperbase;
}

export interface Element2dBase extends ElementBase {
    originX: number;
    originY: number;
    width: number;
    height: number;
}

export interface GroupElement extends ElementBase {
    type: "group";
    childHandles: number[];
}

export interface LineElement extends Element2dBase {
    type: "line";
    penHandle: number;
    brushHandle: number;
    coords: number[];
    arrows?: Uint8Array;
}

interface BitmapBase extends Element2dBase {
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;
    angle: number;
    dibHandle: number;
}

export interface BitmapElement extends BitmapBase {
    type: "bitmap";
}

export interface DoubleBitmapElement extends BitmapBase {
    type: "doubleBitmap";
}

export interface TextElement extends Element2dBase {
    type: "text";
    textToolHandle: number;
    delta: Point2D;
    angle: number;
}

export interface ControlElement extends Element2dBase {
    type: "control";
    inputType: "EDIT" | "BUTTON" | "COMBOBOX";
    text: string;
    dwStyle: number;
    exStyle: number;
    id: number;
    controlSize: Point2D;
}

export interface View3D extends Element2dBase {
    type: "view3D";
    spaceHandle: number;
    cameraHandle: number;
}

export interface EditFrame extends Element2dBase {
    type: "editFrame";
    objectHandle: number;
    size: Point2D;
}

export type VectorDrawingElement2d = LineElement | BitmapElement | DoubleBitmapElement | TextElement | ControlElement | View3D;
export type VectorDrawingElement = VectorDrawingElement2d | GroupElement;
