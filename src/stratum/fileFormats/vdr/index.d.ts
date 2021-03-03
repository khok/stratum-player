import { BinaryStream } from "stratum/helpers/binaryStream";
import { VDRSource, VectorDrawing } from "./types/vectorDrawing";

export * from "./types/vectorDrawing";
export * from "./types/vectorDrawingElements";
export * from "./types/vectorDrawingTools";

/**
 * Считывает данные графического пространства (VDR).
 * Поток данных может являться продолжением файла CLS, либо быть созданным из отдельного VDR-файла.
 */
export function readVdrFile(stream: BinaryStream, source: VDRSource, info?: boolean): VectorDrawing;
