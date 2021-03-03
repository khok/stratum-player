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
    brushTools?: BrushToolParams[];
    penTools?: PenToolParams[];
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

export interface VectorDrawing extends VectorDrawingTools {
    fileversion: number;
    minVersion: number;
    origin: Point2D;
    state: number;
    defaultFlags: number;
    brushHandle: number;
    layers: number;

    source: VDRSource;

    elements?: VectorDrawingElement[];
    elementOrder?: number[];
    crdSystem?: CoordinateSystem;
    otDATAITEMS?: { id: number; data: unknown }[];
}
