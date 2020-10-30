/*
 * Код для чтения размерностей битовых карт, объединения двойных битовых карт в изображение с прозрачностью.
 */

import { PNG } from "pngjs";
import { BinaryStream } from "../binaryStream";
import { bytesToBase64 } from "./base64";
import { decode, readSize } from "./bmpDecoder";

function applyAlphaMask(imageBytes: Uint8Array, maskBytes: Uint8Array, width: number, height: number) {
    for (let i = 3; i < imageBytes.length && i < maskBytes.length; i += 4) {
        imageBytes[i] = 255 - maskBytes[i - 1];
    }
    const png = new PNG({ width, height, inputHasAlpha: true }); //TODO: возможно убрать посл. опцию
    png.data = imageBytes as any;
    return PNG.sync.write(png);
}

function readBitmapSize(stream: BinaryStream) {
    const _pos = stream.position;
    if (stream.uint16() !== 0x4d42) throw new Error("BMP файл поврежден");
    const size = stream.int32();
    stream.seek(_pos);
    return size;
}

function u8toView(arr: Uint8Array) {
    return new DataView(arr.buffer, arr.byteOffset);
}

export function readBitmap(stream: BinaryStream) {
    const size = readBitmapSize(stream);
    const bmpBytes = stream.bytes(size);

    const { width, height } = readSize(u8toView(bmpBytes));
    const base64Image = "data:image/bmp;base64," + bytesToBase64(bmpBytes);
    return { base64Image, width, height };
}

export function readDoubleBitmap(stream: BinaryStream) {
    const bmpBytes = stream.bytes(readBitmapSize(stream));
    const { data: imageData, width, height } = decode(u8toView(bmpBytes));
    const maskBytes = stream.bytes(readBitmapSize(stream));
    const { data: maskData } = decode(u8toView(maskBytes));

    const base64Image = "data:image/png;base64," + bytesToBase64(applyAlphaMask(imageData, maskData, width, height));
    return { base64Image, width, height };
}
