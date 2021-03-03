/*
 * Код для чтения размерностей битовых карт, объединения двойных битовых карт в изображение с прозрачностью.
 */
import { BinaryStream, FileSignatureError } from "stratum/helpers/binaryStream";
import { DibToolImage } from "stratum/helpers/types";
import { decodeBmp, readBMPSize } from "./bmpDecoder";

function readBitmapSize(stream: BinaryStream) {
    const _pos = stream.pos();
    const sign = stream.uint16();
    if (sign !== 0x4d42) throw new FileSignatureError(stream, sign, 0x4d42);
    const size = stream.int32();
    stream.seek(_pos);
    return size;
}

function u8toView(arr: Uint8Array) {
    return new DataView(arr.buffer, arr.byteOffset);
}

export function readBmpFile(stream: BinaryStream): DibToolImage {
    const bmpRaw = stream.bytes(readBitmapSize(stream));

    const v = u8toView(bmpRaw);
    const { width, height } = readBMPSize(v);
    if (width === 0 || height === 0) return null;

    const cnv = document.createElement("canvas");
    cnv.width = width;
    cnv.height = height;
    const ctx = cnv.getContext("2d", { alpha: false });
    if (!ctx) throw Error(`Не удалось создать изображение ${stream.name}`);

    const imageData = ctx.createImageData(width, height);
    decodeBmp(v, imageData.data);
    ctx.putImageData(imageData, 0, 0);
    return ctx;
}

export function readDbmFile(stream: BinaryStream): DibToolImage {
    const bmpRaw1 = stream.bytes(readBitmapSize(stream));
    const bmpRaw2 = stream.bytes(readBitmapSize(stream));

    const v = u8toView(bmpRaw1);
    const { width, height } = readBMPSize(v);
    if (width === 0 || height === 0) return null;

    const cnv = document.createElement("canvas");
    cnv.width = width;
    cnv.height = height;
    const ctx = cnv.getContext("2d", { alpha: true });
    if (!ctx) throw Error(`Не удалось создать изображение ${stream.name}`);

    const imageData = ctx.createImageData(width, height);
    const imageDataData = imageData.data;
    const maskDataData = new Uint8ClampedArray(width * height * 4);

    decodeBmp(v, imageDataData);
    decodeBmp(u8toView(bmpRaw2), maskDataData);

    for (let i = 3; i < imageDataData.length && i < maskDataData.length; i += 4) {
        imageDataData[i] = 255 ^ maskDataData[i - 1];
    }

    ctx.putImageData(imageData, 0, 0);
    return ctx;
}
