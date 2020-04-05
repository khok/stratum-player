import { ImageResolver } from "internal-graphic-types";
import { StratumError } from "~/helpers/errors";
import { BinaryStream } from "~/helpers/binaryStream";
import { readDoubleBitmap, readBitmap } from "~/helpers/imageOperations";
import { ImageToolData, BmpImage } from "data-types-graphics";

/**
 * Временная реализация загрузчика изображений.
 */
export class SimpleImageLoader implements ImageResolver {
    private globalImages = new Map<string, HTMLImageElement>();
    // private localImages = new Map<string, HTMLImageElement>();
    private promises = new Set<Promise<HTMLImageElement>>();

    constructor(private iconsUrlPath: string, private bmpFiles?: { filename: string; data: Uint8Array }[]) {}

    private createImage(data: Promise<BmpImage> | string, name?: string): HTMLImageElement {
        if (name) {
            const cachedImg = this.globalImages.get(name);
            if (cachedImg) return cachedImg;
        }

        const img = new Image();
        const promise = new Promise<HTMLImageElement>(async (res, rej) => {
            img.onload = () => res(img);
            img.onerror = () => rej(new StratumError("Ошибка загрузки изображения: " + name));
            img.src = await data;
        });
        this.promises.add(promise);
        if (name) this.globalImages.set(name, img);
        return img;
    }

    loadImage(data: ImageToolData) {
        if (data.type === "ttDIB2D" || data.type === "ttDOUBLEDIB2D")
            return { image: this.createImage(data.image), width: data.width, height: data.height };

        const url = `${this.iconsUrlPath}/${data.filename.toUpperCase()}`;
        let image: HTMLImageElement;
        if (data.type === "ttREFTODIB2D") {
            image = this.createImage(url, url);
        } else {
            const dataPromise = fetch(url)
                .then((data) => data.arrayBuffer())
                .then((data) => readDoubleBitmap(new BinaryStream(data)))
                .then((data) => data.image);
            image = this.createImage(dataPromise, url);
        }
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
