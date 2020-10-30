import { BinaryStream } from "stratum/helpers/binaryStream";
import { VectorDrawing } from "./types/vectorDrawing";

/**
 * Считывает данные графического пространства (VDR).
 * Поток данных может являться продолжением файла CLS, либо быть созданным из отдельного VDR-файла.
 */
export function readVdrFile(stream: BinaryStream, source: VectorDrawing["source"]): VectorDrawing;

export * from "./types/vectorDrawing";
export * from "./types/vectorDrawingElements";
export * from "./types/vectorDrawingTools";
