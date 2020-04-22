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
    projectImages?: { filename: string; data: Uint8Array }[];
}

export interface BitmapToolFactoryOptions {
    debug_shittyNet?: number;
}

export class BitmapToolFactory {
    private cachedIcons = new Map<string, Promise<HTMLImageElement>>();
    private promises = new Set<Promise<HTMLImageElement>>();

    private iconsPath: string;
    private projectImages?: { filename: string; data: Uint8Array }[];

    private shittyNet: number;

    constructor(data: BitmapToolFactoryData, options?: BitmapToolFactoryOptions) {
        this.iconsPath = data.iconsPath;
        this.projectImages = data.projectImages;
        this.shittyNet = (options && options.debug_shittyNet) || 0;
    }

    fromData(data: ImageToolData): BitmapTool {
        //Из данных base64 (требуются размерности)
        if (data.type === "ttDIB2D" || data.type === "ttDOUBLEDIB2D") {
            const tool = new BitmapTool({ x: data.width, y: data.height });
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
        const tool = new BitmapTool();
        this.promises.add(imagePr.then((image) => (tool.image = image)));
        imagePr.catch(() => {
            console.error(`Ошибка загрузки изображения ${this.iconsPath}/${fname}`);
        });
        return tool;
    }

    get allImagesLoaded() {
        return Promise.all(this.promises);
    }

    fromProjectFile(bmpFilename: string, isDouble: boolean): BitmapTool {
        if (!this.projectImages) throw new StratumError(`В каталоге проекта нет изображений`);
        const name = bmpFilename.replace(/\\\\/g, "\\").toLowerCase();
        const file = this.projectImages.find((f) => f.filename.toLowerCase().endsWith(name));
        if (!file) throw new StratumError(`Файл ${bmpFilename} не найден`);
        const stream = new BinaryStream(file.data);
        // const { image, width, height } = file.filename.endsWith("bmp") ? readBitmap(stream) : readDoubleBitmap(stream);
        const { image, width, height } = isDouble ? readDoubleBitmap(stream) : readBitmap(stream);
        const tool = new BitmapTool({ x: width, y: height });
        loadImage(image, this.shittyNet).then((imageElement) => (tool.image = imageElement));
        return tool;
    }
}
