import { ImageResolver } from "internal-graphic-types";
import { StratumError } from "~/helpers/errors";

/**
 * Временная реализация загрузчика изображений.
 */
export class SimpleImageLoader implements ImageResolver {
    private globalImages = new Map<string, HTMLImageElement>();
    // private localImages = new Map<string, HTMLImageElement>();
    private promises = new Set<Promise<void>>();

    constructor(private iconsPath: string, private bmpFiles?: { filename: string; data: string }[]) {}

    private loadImg(iconUrl: string) {
        const element = this.globalImages.get(iconUrl);
        if (element) return element;

        const img = new Image();
        this.promises.add(
            new Promise((res, rej) => {
                img.onload = () => res();
                img.onerror = () => rej(new StratumError("Не могу загрузить " + iconUrl));
            })
        );
        img.src = iconUrl;
        this.globalImages.set(iconUrl, img);
        return img;
    }
    fromData(base64Data: string): HTMLImageElement {
        return this.loadImg("data:image/bmp;base64," + base64Data);
    }
    fromFile(filename: string): HTMLImageElement {
        return this.loadImg(`${this.iconsPath}/${filename.toUpperCase()}`);
    }
    getPromise() {
        return Promise.all(this.promises);
    }
    fromProjectFile(bmpFilename: string): HTMLImageElement {
        const name = bmpFilename.toLowerCase();
        if (!this.bmpFiles) throw new StratumError(`В каталоге проекта нет изображений`);
        const file = this.bmpFiles.find(f => f.filename.toLowerCase().endsWith(name));
        if (!file) throw new StratumError(`Файл ${bmpFilename} не найден`);
        return this.fromData(file.data);
    }
}
