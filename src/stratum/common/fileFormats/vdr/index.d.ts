import { BinaryStream } from "/helpers/binaryStream";
import { VectorDrawing } from "./types/vectorDrawing";

/**
 * Считывает данные графического пространства (VDR).
 * Поток данных может являться продолжением файла CLS, либо быть созданным из отдельного VDR-файла.
 */
export function readVdrFile(stream: BinaryStream, source: VectorDrawing["source"]): VectorDrawing;
