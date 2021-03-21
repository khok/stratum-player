import { BinaryReader, FileSignatureError } from "stratum/helpers/binaryReader";

export interface FloatMatrix {
    minX: number;
    minY: number;
    rows: number;
    cols: number;
    data: number[];
}

export function readMatFile(reader: BinaryReader): FloatMatrix {
    // const sizeofDouble = 8;
    const sign = reader.uint16();
    if (sign !== 0x0c) throw new FileSignatureError(reader, sign, 0x0c);
    reader.seek(14);
    const rows = reader.int32();
    const cols = reader.int32();
    const minX = reader.int32();
    const minY = reader.int32();
    reader.uint16(); //type
    reader.uint16(); //должен быть 0
    const data = Array.from({ length: rows * cols }, () => reader.float64());
    return { minX, minY, rows, cols, data };
}
