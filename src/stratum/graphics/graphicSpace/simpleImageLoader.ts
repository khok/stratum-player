import { ImageResolver } from "internal-graphic-types";
import { StratumError } from "~/helpers/errors";

/**
 * Временная реализация загрузчика изображений.
 */
export class SimpleImageLoader implements ImageResolver {
    private data = new Map<string, HTMLImageElement>();
    private promises = new Set<Promise<void>>();

    constructor(private iconsPath: string) {}

    private loadImg(iconUrl: string) {
        const element = this.data.get(iconUrl);
        if (element) return element;

        const img = new Image();
        this.promises.add(
            new Promise((res, rej) => {
                img.onload = () => res();
                img.onerror = () => rej(new StratumError("Не могу загрузить " + iconUrl));
            })
        );
        img.src = iconUrl;
        this.data.set(iconUrl, img);
        return img;
    }
    fromData(base64Data: string): HTMLImageElement {
        return this.loadImg(base64Data);
    }
    fromFile(filename: string): HTMLImageElement {
        return this.loadImg(`${this.iconsPath}/${filename.toUpperCase()}`);
    }
    getPromise() {
        return Promise.all(this.promises);
    }
    fromProjectFile(bmpFilename: string): HTMLImageElement {
        throw new Error("Method not implemented.");
    }
}
