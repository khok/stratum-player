/*
 * Код для чтения размерностей битовых карт, объединения двойных битовых карт в изображение с прозрачностью.
 */
import { BinaryStream } from "stratum/helpers/binaryStream";
import { FileSignatureError } from "stratum/helpers/errors";
import { bytesToBase64 } from "./base64";
import { decodeBmp, readBMPSize } from "./bmpDecoder";

export interface Base64Image {
    base64Image: string;
    width: number;
    height: number;
}

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

export function readBmpFile(stream: BinaryStream): Base64Image {
    const bmpRaw = stream.bytes(readBitmapSize(stream));

    const { width, height } = readBMPSize(u8toView(bmpRaw));
    return { base64Image: "data:image/bmp;base64," + bytesToBase64(bmpRaw), width, height };
}

const cnv = document.createElement("canvas");
const ctx = cnv.getContext("2d")!;
export function readDbmFile(stream: BinaryStream): Base64Image {
    const bmpRaw1 = stream.bytes(readBitmapSize(stream));
    const bmpRaw2 = stream.bytes(readBitmapSize(stream));

    const { data: imageData, width, height } = decodeBmp(u8toView(bmpRaw1));
    const { data: maskData } = decodeBmp(u8toView(bmpRaw2));

    for (let i = 3; i < imageData.length && i < maskData.length; i += 4) {
        imageData[i] = 255 ^ maskData[i - 1];
    }
    cnv.width = width;
    cnv.height = height;
    ctx.putImageData(new ImageData(imageData, width, height), 0, 0);
    return { base64Image: cnv.toDataURL(), width, height };
}
