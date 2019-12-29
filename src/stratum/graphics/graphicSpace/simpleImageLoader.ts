import { ImageResolver } from "internal-graphic-types";

/**
 * Временная реализация загрузчика изображений.
 */
export class SimpleImageLoader implements ImageResolver {
    private iconsPath = "data/icons";
    private data = new Map<string, HTMLImageElement>();
    private promises = new Set<Promise<void>>();
    private loadImg(iconUrl: string) {
        // console.log(iconName);
        const element = this.data.get(iconUrl);
        if (element) return element;

        const img = new Image();
        this.promises.add(
            new Promise((res, rej) => {
                img.onload = () => res();
                img.onerror = () => rej();
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
        return this.loadImg(`${this.iconsPath}/${filename}`);
    }
    getPromise() {
        return Promise.all(this.promises);
    }
}
