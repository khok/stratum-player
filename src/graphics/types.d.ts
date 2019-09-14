export interface BrushTool {
    color: string;
    style: number;
}

export interface PenTool {
    color: string;
    style: number;
    width: number;
    rop2: number;
}

export interface Font {
    OldLogfont: any;
    fontSize: number;
}

export interface TextData {
    ltFgColor: string;
    ltBgColor: string;
    fontHandle: number;
    stringHandle: number;
}

export interface BitmapRefTool {
    type: "bitmapRef";
    filename: string;
}

export interface BitmapDataTool {
    type: "bitmapData";
    image: string;
}

export interface DoubleBitmapDataTool {
    type: "doubleBitmapData";
    images: [string, string];
}

type Point2d = { x: number; y: number };

interface ElementBase {
    options: number;
    name: string;
}

interface Element2dBase extends ElementBase {
    position: Point2d;
    size: Point2d;
}

export interface GroupData extends ElementBase {
    type: "group";
    childHandles: number[];
}

export interface Line extends Element2dBase {
    type: "line";
    penHandle: number;
    brushHandle: number;
    points: Point2d[];
}

interface BitmapBase extends Element2dBase {
    data: {
        origin: Point2d;
        size: Point2d;
        angle: number;
        sourceHandle: number;
    };
}

export interface Bitmap extends BitmapBase {
    type: "bitmap";
}

export interface DoubleBitmap extends BitmapBase {
    type: "doubleBitmap";
}

export interface Text extends Element2dBase {
    type: "text";
    textHandle: number;
    delta: number;
    angle: number;
}

export interface Control extends Element2dBase {
    type: "control";
    data: {
        className: "Edit" | "Button" | "ComboBox";
        dwStyle: number;
        exStyle: number;
        id: number;
        size: Point2d;
        text: string;
    };
}

export type Element2d = Line | Bitmap | DoubleBitmap | Text | Control;
export type Element = Element2d | GroupData;

export type HandleMap<T> = Map<number, T>;

export interface VectorDrawData {
    origin: { x: number; y: number };
    brushHandle?: number;
    brushes?: HandleMap<BrushTool>;
    pens?: HandleMap<PenTool>;
    bitmaps?: HandleMap<BitmapRefTool | BitmapDataTool>;
    doubleBitmaps?: HandleMap<BitmapRefTool | DoubleBitmapDataTool>;
    fonts?: HandleMap<Font>;
    strings?: HandleMap<string>;
    texts?: HandleMap<TextData>;
    elements?: HandleMap<Element>;
    elementOrder?: number[];
}
