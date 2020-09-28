import { BinaryStream } from "/helpers/binaryStream";
import { readBitmap, readDoubleBitmap } from "/helpers/bitmapReaders";
import { ImageToolParams } from "/common/fileFormats/vdr/types/vectorDrawingTools";
import { SceneBmpTool } from "./tools/sceneBmpTool";

export interface BmpToolFactoryArgs {
    iconsPath?: string;
}

export class BmpToolFactory {
    private static cachedIcons = new Map<string, Promise<HTMLImageElement>>();
    private static promises = new Set<Promise<unknown>>();
    private static iconsPath: string = "data/icons";

    static setParams({ iconsPath }: BmpToolFactoryArgs) {
        if (iconsPath !== undefined) this.iconsPath = iconsPath;
    }

    private static loadImage(src: string) {
        return new Promise<HTMLImageElement>(async (res, rej) => {
            const img = new Image();
            // img.onload = () => setTimeout(() => res(img), Math.random() * 3000);
            img.onload = () => res(img);

            img.onerror = () => rej("Ошибка загрузки изображения " + src);
            img.src = src;
        });
    }

    static loadFromParams(params: ImageToolParams): SceneBmpTool {
        //Из данных base64 (требуются размерности)
        if (params.type === "ttDIB2D" || params.type === "ttDOUBLEDIB2D") {
            const tool = new SceneBmpTool(params);
            const imagePr = this.loadImage(params.base64Image);
            this.promises.add(imagePr.then((image) => tool.setImage(image)));
            imagePr.catch(() => console.error(`Ошибка загрузки изображения ${params.type} #${params.handle}`));
            return tool;
        }

        //Ссылка на иконку (размерности (вроде) не нужны)
        const fname = params.filename.toUpperCase();
        let imagePr = this.cachedIcons.get(fname);
        if (!imagePr) {
            const url = `${this.iconsPath}/${fname}`;
            if (params.type === "ttREFTODIB2D") {
                imagePr = this.loadImage(url);
            } else {
                imagePr = fetch(url)
                    .then((res) => res.arrayBuffer())
                    .then((bytes) => this.loadImage(readDoubleBitmap(new BinaryStream(bytes)).base64Image));
            }
            this.cachedIcons.set(fname, imagePr);
        }
        const tool = new SceneBmpTool(params);
        this.promises.add(imagePr.then((image) => tool.setImage(image)));
        imagePr.catch((err) => console.error(err));
        return tool;
    }

    static loadFromStream(stream: BinaryStream, handle: number, isDouble: boolean): SceneBmpTool | undefined {
        const { base64Image, width, height } = isDouble ? readDoubleBitmap(stream) : readBitmap(stream);
        const tool = new SceneBmpTool({ handle, width, height });
        const imagePr = this.loadImage(base64Image);
        imagePr.then((imageElement) => tool.setImage(imageElement));
        imagePr.catch(() => console.error(`Ошибка загрузки изображения ${stream.filename} #${handle}`));
        return tool;
    }

    static get allImagesLoaded(): Promise<unknown> {
        return Promise.all(this.promises).then(() => {
            this.promises.clear();
        });
    }
}
