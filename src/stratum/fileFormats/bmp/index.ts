/*
 * Код для чтения размерностей битовых карт, объединения двойных битовых карт в изображение с прозрачностью.
 */
import { BinaryReader, FileSignatureError } from "stratum/helpers/binaryReader";
import { decodeBmp, readBMPSize } from "./bmpDecoder";
import { DibToolImage } from "./dibToolImage";

function readBitmapSize(reader: BinaryReader) {
    const _pos = reader.pos();
    const sign = reader.uint16();
    if (sign !== 0x4d42) throw new FileSignatureError(reader, sign, 0x4d42);
    const size = reader.int32();
    reader.seek(_pos);
    return size;
}

function u8toView(arr: Uint8Array) {
    return new DataView(arr.buffer, arr.byteOffset);
}

export function readBmpFile(reader: BinaryReader): DibToolImage {
    const bmpRaw = reader.bytes(readBitmapSize(reader));

    const v = u8toView(bmpRaw);
    const { width, height } = readBMPSize(v);
    if (width === 0 || height === 0) return null;

    const cnv = document.createElement("canvas");
    cnv.width = width;
    cnv.height = height;
    const ctx = cnv.getContext("2d", { alpha: false });
    if (!ctx) throw Error(`Не удалось создать изображение ${reader.name}`);

    const imageData = ctx.createImageData(width, height);
    decodeBmp(v, imageData.data);
    ctx.putImageData(imageData, 0, 0);
    return ctx;
}

export function readDbmFile(reader: BinaryReader): DibToolImage {
    const bmpRaw1 = reader.bytes(readBitmapSize(reader));
    const bmpRaw2 = reader.bytes(readBitmapSize(reader));

    const v = u8toView(bmpRaw1);
    const { width, height } = readBMPSize(v);
    if (width === 0 || height === 0) return null;

    const cnv = document.createElement("canvas");
    cnv.width = width;
    cnv.height = height;
    const ctx = cnv.getContext("2d", { alpha: true });
    if (!ctx) throw Error(`Не удалось создать изображение ${reader.name}`);

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
