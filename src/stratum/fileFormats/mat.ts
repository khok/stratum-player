import { BinaryStream, FileSignatureError } from "stratum/helpers/binaryStream";

export interface FloatMatrix {
    minX: number;
    minY: number;
    rows: number;
    cols: number;
    data: number[];
}

export function readMatFile(stream: BinaryStream): FloatMatrix {
    // const sizeofDouble = 8;
    const sign = stream.uint16();
    if (sign !== 0x0c) throw new FileSignatureError(stream, sign, 0x0c);
    stream.seek(14);
    const rows = stream.int32();
    const cols = stream.int32();
    const minX = stream.int32();
    const minY = stream.int32();
    stream.uint16(); //type
    stream.uint16(); //должен быть 0
    const data = Array.from({ length: rows * cols }, () => stream.float64());
    return { minX, minY, rows, cols, data };
}
