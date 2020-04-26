import { ProjectFile } from "other-types";
import { ImageToolData } from "vdr-types";
import { BinaryStream } from "~/helpers/binaryStream";
import { StratumError } from "~/helpers/errors";
import { readBitmap, readDoubleBitmap } from "~/helpers/imageOperations";
import { BitmapTool } from "./tools";

function loadImage(data: string, shittyNet: number) {
    const img = new Image();
    return new Promise<HTMLImageElement>(async (res, rej) => {
        //для дебага
        if (shittyNet) img.onload = () => setTimeout(() => res(img), Math.random() * shittyNet);
        else img.onload = () => res(img);

        img.onerror = () => rej();
        img.src = data;
    });
}

export interface BitmapToolFactoryData {
    iconsPath: string;
    projectImages?: ProjectFile[];
}

export interface BitmapToolFactoryOptions {
    debug_shittyNet?: number;
}

export class BitmapToolFactory {
    private cachedIcons = new Map<string, Promise<HTMLImageElement>>();
    private promises = new Set<Promise<HTMLImageElement>>();

    private iconsPath: string;
    private projectImages?: ProjectFile[];

    private shittyNet: number;

    constructor(data: BitmapToolFactoryData, options?: BitmapToolFactoryOptions) {
        this.iconsPath = data.iconsPath;
        this.projectImages = data.projectImages;
        this.shittyNet = (options && options.debug_shittyNet) || 0;
    }

    fromData(data: ImageToolData): BitmapTool {
        //Из данных base64 (требуются размерности)
        if (data.type === "ttDIB2D" || data.type === "ttDOUBLEDIB2D") {
            const tool = new BitmapTool(data);
            const imagePr = loadImage(data.image, this.shittyNet);
            this.promises.add(imagePr.then((image) => (tool.image = image)));
            imagePr.catch(() => {
                console.error(`Ошибка загрузки изображения ${data.type} #${data.handle}`);
            });
            return tool;
        }

        //Ссылка на иконку (размерности (вроде) не нужны)
        const fname = data.filename.toUpperCase();
        let imagePr = this.cachedIcons.get(fname);
        if (!imagePr) {
            const url = `${this.iconsPath}/${fname}`;
            if (data.type === "ttREFTODIB2D") {
                imagePr = loadImage(url, this.shittyNet);
            } else {
                imagePr = fetch(url)
                    .then((res) => res.arrayBuffer())
                    .then((bytes) => loadImage(readDoubleBitmap(new BinaryStream(bytes)).image, this.shittyNet));
            }
            this.cachedIcons.set(fname, imagePr);
        }
        const tool = new BitmapTool(data);
        this.promises.add(imagePr.then((image) => (tool.image = image)));
        imagePr.catch(() => {
            console.error(`Ошибка загрузки изображения ${this.iconsPath}/${fname}`);
        });
        return tool;
    }

    get allImagesLoaded() {
        return Promise.all(this.promises);
    }

    fromProjectFile(handle: number, bmpFilename: string, isDouble: boolean): BitmapTool {
        if (!this.projectImages) {
            console.warn(`Невозможно загрузить ${bmpFilename}: В каталоге проекта нет изображений`);
            return new BitmapTool({ handle, width: 1, height: 1 });
        }
        const name = bmpFilename
            .split("\\")
            .filter((n) => n)
            .join("\\")
            .toLowerCase();
        const file = this.projectImages.find((f) => f.filename.toLowerCase() === name);
        if (!file) {
            console.warn(`Файл ${bmpFilename} не найден`);
            return new BitmapTool({ handle, width: 1, height: 1 });
        }
        const stream = new BinaryStream(file.data);
        const { image, width, height } = isDouble ? readDoubleBitmap(stream) : readBitmap(stream);
        const tool = new BitmapTool({ handle, width, height });
        loadImage(image, this.shittyNet).then((imageElement) => (tool.image = imageElement));
        return tool;
    }
}
