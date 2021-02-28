/*
 * Код для чтения размерностей битовых карт, объединения двойных битовых карт в изображение с прозрачностью.
 */
import { BinaryStream, FileSignatureError } from "stratum/helpers/binaryStream";
import { decodeBmp } from "./bmpDecoder";

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

export function readBmpFile(stream: BinaryStream): HTMLCanvasElement {
    const bmpRaw = stream.bytes(readBitmapSize(stream));

    const { data, width, height } = decodeBmp(u8toView(bmpRaw));

    // for (let i = 3; i < data.length; i += 4) {
    //     data[i] = 255;
    // }

    const cnv = document.createElement("canvas");
    cnv.width = width;
    cnv.height = height;
    const ctx = cnv.getContext("2d", { alpha: false });
    if (!ctx) throw Error(`Не удалось создать изображение ${stream.meta.filepathDos}`);
    ctx.putImageData(new ImageData(data, width, height), 0, 0);
    return cnv;
}

export function readDbmFile(stream: BinaryStream): HTMLCanvasElement {
    const bmpRaw1 = stream.bytes(readBitmapSize(stream));
    const bmpRaw2 = stream.bytes(readBitmapSize(stream));

    const { data: imageData, width, height } = decodeBmp(u8toView(bmpRaw1));
    const { data: maskData } = decodeBmp(u8toView(bmpRaw2));

    for (let i = 3; i < imageData.length && i < maskData.length; i += 4) {
        imageData[i] = 255 ^ maskData[i - 1];
    }
    const cnv = document.createElement("canvas");
    cnv.width = width;
    cnv.height = height;
    const ctx = cnv.getContext("2d", { alpha: true });
    if (!ctx) throw Error(`Не удалось создать изображение ${stream.meta.filepathDos}`);
    ctx.putImageData(new ImageData(imageData, width, height), 0, 0);
    return cnv;
}
