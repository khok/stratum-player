import { decode } from "./bmpDecoder";
import { PNG } from "pngjs";

export function applyAlphaMask(imageBytes, maskBytes) {
    const { width, height, data: imageData } = decode(imageBytes);
    const { data: maskData } = decode(maskBytes);
    for (let i = 3; i < imageData.length && i < maskData.length; i += 4) {
        imageData[i] = 255 - maskData[i - 1];
    }
    const png = new PNG({ width: width, height: height, inputHasAlpha: true, filterType: 4 });
    png.data = imageData;
    return PNG.sync.write(png);
}
