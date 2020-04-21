import { VectorDrawData } from "vdr-types";
import { BinaryStream } from "~/helpers/binaryStream";

/**
 * Считывает данные графического пространства (VDR).
 * Поток данных может являться продолжением файла CLS, либо быть созданным из отдельного VDR-файла.
 * Возвращает данные VDR в плохом (считанном) и хорошем (структурированном) виде
 */
export function readVectorDrawData(stream: BinaryStream): VectorDrawData;
