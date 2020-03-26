import { ImageResolver, ImageToolData } from "internal-graphic-types";
import { StratumError } from "~/helpers/errors";
import { BinaryStream } from "~/helpers/binaryStream";
import { readDoubleBitmap } from "~/helpers/imageOperations";

/**
 * Временная реализация загрузчика изображений.
 */
export class SimpleImageLoader implements ImageResolver {
    private globalImages = new Map<string, HTMLImageElement>();
    // private localImages = new Map<string, HTMLImageElement>();
    private promises = new Set<Promise<HTMLImageElement>>();

    constructor(private iconsUrlPath: string, private bmpFiles?: { filename: string; data: string }[]) {}

    private loadImg(iconUrl: string): HTMLImageElement {
        const cachedImg = this.globalImages.get(iconUrl);
        if (cachedImg) return cachedImg;

        const img = new Image();
        const promise = new Promise<HTMLImageElement>((res, rej) => {
            img.onload = () => res(img);
            img.onerror = () => rej(new StratumError("Ошибка загрузки изображения: " + iconUrl));
            img.src = iconUrl;
        });
        this.promises.add(promise);
        this.globalImages.set(iconUrl, img);
        return img;
    }
    private loadImg2(iconUrl: string): HTMLImageElement {
        const cachedImg = this.globalImages.get(iconUrl);
        if (cachedImg) return cachedImg;

        const img = new Image();
        const promise = new Promise<HTMLImageElement>(async (res, rej) => {
            try {
                const stream = new BinaryStream(await (await fetch(iconUrl)).arrayBuffer());
                const base64Png = readDoubleBitmap(stream);
                img.onload = () => res(img);
                img.onerror = () => rej(new StratumError("Файл не является изображением: " + iconUrl));
                img.src = base64Png;
            } catch (e) {
                rej(new StratumError("Ошибка загрузки изображения: " + iconUrl));
            }
        });
        this.promises.add(promise);
        this.globalImages.set(iconUrl, img);
        return img;
    }

    loadImage(data: ImageToolData) {
        if (data.type === "ttDIB2D" || data.type === "ttDOUBLEDIB2D") return this.loadImg(data.image);

        if (data.type !== "ttREFTODIB2D" && data.type !== "ttREFTODOUBLEDIB2D")
            throw Error(`unknown image type: ${data.type}`);

        const url = `${this.iconsUrlPath}/${data.filename.toUpperCase()}`;
        return data.type === "ttREFTODIB2D" ? this.loadImg(url) : this.loadImg2(url);
    }

    get allImagesLoaded() {
        return Promise.all(this.promises);
    }

    fromProjectFile(bmpFilename: string): HTMLImageElement {
        const name = bmpFilename.toLowerCase();
        if (!this.bmpFiles) throw new StratumError(`В каталоге проекта нет изображений`);
        const file = this.bmpFiles.find(f => f.filename.toLowerCase().endsWith(name));
        if (!file) throw new StratumError(`Файл ${bmpFilename} не найден`);
        return this.loadImg("data:image/bmp;base64," + file.data);
    }
}
