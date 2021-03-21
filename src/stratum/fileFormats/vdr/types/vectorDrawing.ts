import { Point2D } from "stratum/helpers/types";
import { VectorDrawingElement } from "./vectorDrawingElements";
import {
    BrushToolParams,
    DibToolParams,
    DoubleDibToolParams,
    ExternalDibToolParams,
    ExternalDoubleDibToolParams,
    FontToolParams,
    PenToolParams,
    StringToolParams,
    TextToolParams,
} from "./vectorDrawingTools";

export interface VectorDrawingTools {
    penTools?: PenToolParams[];
    brushTools?: BrushToolParams[];
    dibTools?: (DibToolParams | ExternalDibToolParams)[];
    doubleDibTools?: (DoubleDibToolParams | ExternalDoubleDibToolParams)[];
    fontTools?: FontToolParams[];
    stringTools?: StringToolParams[];
    textTools?: TextToolParams[];
}

export interface CoordinateSystem {
    type: number;
    objectHandle: number;
    center: Point2D;
    matrix: number[];
}

/**
 * Формат файла, описывающий содержимое векторного пространства.
 * Разделен на два интерфейса для удобства.
 */

export interface VDRSource {
    origin: "file" | "class";
    name: string;
}

export interface VDRSetting {
    id: number;
    data: Uint8Array;
}

export interface VectorDrawingBase extends VectorDrawingTools {
    version: number;
    origin: Point2D;
    scaleDiv: Point2D;
    scaleMul: Point2D;
    state: number;
    flags: number;
    brushHandle: number;
    layers: number;

    elements?: VectorDrawingElement[];
    elementOrder?: number[];
    crdSystem?: CoordinateSystem;
    settings?: VDRSetting[];
}

export interface VectorDrawing extends VectorDrawingBase {
    source: VDRSource;
}
