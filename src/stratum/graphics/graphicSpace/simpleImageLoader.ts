import { ImageResolver } from "internal-graphic-types";
import { StratumError } from "~/helpers/errors";

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
        });
        img.src = iconUrl;
        this.promises.add(promise);
        this.globalImages.set(iconUrl, img);
        return img;
    }
    fromBase64(base64Data: string, type: "bmp" | "png"): HTMLImageElement {
        return this.loadImg(`data:image/${type};base64,` + base64Data);
    }
    fromIconUrl(url: string): HTMLImageElement {
        return this.loadImg(`${this.iconsUrlPath}/${url.toUpperCase()}`);
    }
    get allImagesLoaded() {
        return Promise.all(this.promises);
    }
    fromProjectFile(bmpFilename: string): HTMLImageElement {
        const name = bmpFilename.toLowerCase();
        if (!this.bmpFiles) throw new StratumError(`В каталоге проекта нет изображений`);
        const file = this.bmpFiles.find(f => f.filename.toLowerCase().endsWith(name));
        if (!file) throw new StratumError(`Файл ${bmpFilename} не найден`);
        return this.fromBase64(file.data, "bmp");
    }
}
