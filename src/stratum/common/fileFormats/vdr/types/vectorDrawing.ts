import { Point2D } from "/helpers/types";
import { VectorDrawingElement } from "./vectorDrawingElements";
import {
    BmpToolParams,
    BrushToolParams,
    DoubleBmpToolParams,
    ExternalBmpToolParams,
    ExternalDoubleBmpToolParams,
    FontToolParams,
    PenToolParams,
    StringToolParams,
    TextToolParams,
} from "./vectorDrawingTools";

export interface VectorDrawingTools {
    bitmapTools?: (BmpToolParams | ExternalBmpToolParams)[];
    brushTools?: BrushToolParams[];
    doubleBitmapTools?: (DoubleBmpToolParams | ExternalDoubleBmpToolParams)[];
    fontTools?: FontToolParams[];
    penTools?: PenToolParams[];
    stringTools?: StringToolParams[];
    textTools?: TextToolParams[];
}

/**
 * Формат файла, описывающий содержимое векторного пространства.
 * Разделен на два интерфейса для удобства.
 */
export interface VectorDrawing extends VectorDrawingTools {
    fileversion: number;
    minVersion: number;
    origin: Point2D;
    state: number;
    defaultFlags: number;
    brushHandle: number;
    layers: number;

    source?: { origin: "file" | "class"; name: string };

    elements?: VectorDrawingElement[];
    elementOrder?: number[];
}
