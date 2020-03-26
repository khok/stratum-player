import { decode } from "./bmpDecoder";
import { PNG } from "pngjs";
import { BinaryStream } from "~/helpers/binaryStream";
import { StratumError } from "~/helpers/errors";

function applyAlphaMask(imageBytes, maskBytes) {
    const { width, height, data: imageData } = decode(imageBytes);
    const { data: maskData } = decode(maskBytes);
    for (let i = 3; i < imageData.length && i < maskData.length; i += 4) {
        imageData[i] = 255 - maskData[i - 1];
    }
    const png = new PNG({ width: width, height: height, inputHasAlpha: true, filterType: 4 });
    png.data = imageData;
    return PNG.sync.write(png);
}

function readBitmapSize(stream) {
    const _pos = stream.position;
    if (stream.readWord() !== 0x4d42) throw new StratumError("BMP файл поврежден");
    const size = stream.readLong();
    stream.seek(_pos);
    return size;
}

export function readBitmap(stream) {
    return "data:image/bmp;base64," + stream.readBase64(readBitmapSize(stream));
}

export function readDoubleBitmap(stream) {
    const bmpBytes = stream.readBytes(readBitmapSize(stream));
    const maskBytes = stream.readBytes(readBitmapSize(stream));

    const pngImage = applyAlphaMask(bmpBytes, maskBytes);
    return "data:image/png;base64," + new BinaryStream(pngImage).readBase64(pngImage.length);
}
