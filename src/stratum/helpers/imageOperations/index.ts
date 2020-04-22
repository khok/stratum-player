import { PNG } from "pngjs";
import { BinaryStream } from "~/helpers/binaryStream";
import { StratumError } from "~/helpers/errors";
import { bytesToBase64 } from "./base64";
import { decode, readSize } from "./bmpDecoder";

function applyAlphaMask(imageData: Uint8Array, maskData: Uint8Array, width: number, height: number) {
    for (let i = 3; i < imageData.length && i < maskData.length; i += 4) {
        imageData[i] = 255 - maskData[i - 1];
    }
    const png = new PNG({ width, height, inputHasAlpha: true });
    png.data = imageData as any;
    return PNG.sync.write(png);
}

function readBitmapSize(stream: BinaryStream) {
    const _pos = stream.position;
    if (stream.readWord() !== 0x4d42) throw new StratumError("BMP файл поврежден");
    const size = stream.readLong();
    stream.seek(_pos);
    return size;
}

function u8toView(arr: Uint8Array) {
    return new DataView(arr.buffer, arr.byteOffset);
}

export function readBitmap(stream: BinaryStream) {
    const size = readBitmapSize(stream);
    const bmpBytes = stream.readBytes(size);

    const { width, height } = readSize(u8toView(bmpBytes));
    const image = "data:image/bmp;base64," + bytesToBase64(bmpBytes);
    return { image, width, height };
}

export function readDoubleBitmap(stream: BinaryStream) {
    const bmpBytes = stream.readBytes(readBitmapSize(stream));
    const { data: imageData, width, height } = decode(u8toView(bmpBytes));
    const maskBytes = stream.readBytes(readBitmapSize(stream));
    const { data: maskData } = decode(u8toView(maskBytes));

    const image = "data:image/png;base64," + bytesToBase64(applyAlphaMask(imageData, maskData, width, height));
    return { image, width, height };
}
