import { VectorDrawData } from "vdr-types";
import { BinaryStream } from "~/helpers/binaryStream";

/**
 * Считывает данные графического пространства (VDR).
 * Поток данных может являться продолжением файла CLS, либо быть созданным из отдельного VDR-файла.
 */
export function readVectorDrawData(stream: BinaryStream): VectorDrawData;
