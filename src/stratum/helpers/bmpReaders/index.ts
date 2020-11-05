/*
 * Код для чтения размерностей битовых карт, объединения двойных битовых карт в изображение с прозрачностью.
 */
import { BinaryStream } from "../binaryStream";
import { FileSignatureError } from "../errors";
import { bytesToBase64 } from "./base64";
import { readBMPFull, readBMPSize } from "./decoder";

function readBitmapSize(stream: BinaryStream) {
    const _pos = stream.position;
    const sign = stream.uint16();
    if (sign !== 0x4d42) throw new FileSignatureError(stream, sign, 0x4d42);
    const size = stream.int32();
    stream.seek(_pos);
    return size;
}

function u8toView(arr: Uint8Array) {
    return new DataView(arr.buffer, arr.byteOffset);
}

export function readBitmap(stream: BinaryStream) {
    const bmpRaw = stream.bytes(readBitmapSize(stream));

    const { width, height } = readBMPSize(u8toView(bmpRaw));
    const base64Image = "data:image/bmp;base64," + bytesToBase64(bmpRaw);
    return { base64Image, width, height };
}

const cnv = document.createElement("canvas");
const ctx = cnv.getContext("2d")!;
export function readDoubleBitmap(stream: BinaryStream) {
    const bmpRaw1 = stream.bytes(readBitmapSize(stream));
    const bmpRaw2 = stream.bytes(readBitmapSize(stream));

    const { data: imageData, width, height } = readBMPFull(u8toView(bmpRaw1));
    const { data: maskData } = readBMPFull(u8toView(bmpRaw2));

    for (let i = 3; i < imageData.length && i < maskData.length; i += 4) {
        imageData[i] = 255 ^ maskData[i - 1];
    }
    cnv.width = width;
    cnv.height = height;
    ctx.putImageData(new ImageData(imageData, width, height), 0, 0);
    return { base64Image: cnv.toDataURL(), width, height };
}
