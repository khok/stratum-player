import { ImageResolver } from "internal-graphic-types";
import { StratumError } from "~/helpers/errors";
import { BinaryStream } from "~/helpers/binaryStream";
import { readDoubleBitmap, readBitmap } from "~/helpers/imageOperations";
import { ImageToolData, BmpImage } from "data-types-graphics";

/**
 * Временная реализация загрузчика изображений.
 */
export class SimpleImageLoader implements ImageResolver {
    private cachedIcons = new Map<string, HTMLImageElement>();
    private promises = new Set<Promise<HTMLImageElement>>();

    constructor(private iconsUrlPath: string, private bmpFiles?: { filename: string; data: Uint8Array }[]) {}

    private createImage(data: Promise<BmpImage> | string): HTMLImageElement {
        const img = new Image();
        const promise = new Promise<HTMLImageElement>(async (res, rej) => {
            img.onload = () => res();
            img.onerror = () => rej(new StratumError("Ошибка загрузки изображения: " + data));
            img.src = await data;
        });
        this.promises.add(promise);
        return img;
    }

    loadImage(data: ImageToolData) {
        //from base64
        if (data.type === "ttDIB2D" || data.type === "ttDOUBLEDIB2D")
            return { image: this.createImage(data.image), width: data.width, height: data.height };

        //from icon url
        const fname = data.filename.toUpperCase();
        let image: HTMLImageElement | undefined;
        image = this.cachedIcons.get(fname);
        if (image) return { image, width: image.width, height: image.height };

        const url = `${this.iconsUrlPath}/${fname}`;
        if (data.type === "ttREFTODIB2D") {
            image = this.createImage(url);
        } else {
            const dataPromise = fetch(url)
                .then((data) => data.arrayBuffer())
                .then((data) => readDoubleBitmap(new BinaryStream(data)))
                .then((data) => data.image);
            image = this.createImage(dataPromise);
        }
        this.cachedIcons.set(fname, image);
        return { image, width: image.width, height: image.height };
    }

    get allImagesLoaded() {
        return Promise.all(this.promises);
    }

    fromProjectFile(bmpFilename: string) {
        if (!this.bmpFiles) throw new StratumError(`В каталоге проекта нет изображений`);
        const name = bmpFilename.replace("\\\\", "\\").toLowerCase();
        const file = this.bmpFiles.find((f) => f.filename.toLowerCase().endsWith(name));
        if (!file) throw new StratumError(`Файл ${bmpFilename} не найден`);
        const stream = new BinaryStream(file.data);
        const { image, width, height } = file.filename.endsWith("bmp") ? readBitmap(stream) : readDoubleBitmap(stream);
        return { image: this.createImage(image), width, height };
    }
}
