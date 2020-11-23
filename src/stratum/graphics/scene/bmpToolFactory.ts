import { options } from "stratum/api";
import { ImageToolParams } from "stratum/fileFormats/vdr";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { readBmpFile, readDbmFile } from "stratum/fileFormats/bmp";
import { SceneBmpTool } from "./tools/sceneBmpTool";

export class BmpToolFactory {
    private static cachedIcons = new Map<string, Promise<HTMLImageElement>>();

    private static loadImage(src: string) {
        return new Promise<HTMLImageElement>((res, rej) => {
            const img = new Image();
            // img.onload = () => setTimeout(() => res(img), Math.random() * 3000); //Имитация медленной загрузки.
            img.onload = () => res(img);
            img.onerror = () => rej();
            img.src = src;
        });
    }

    private static loadDBM(url: string) {
        return new Promise<HTMLImageElement>(async (res) => {
            const data = await fetch(url);
            const bytes = await data.arrayBuffer();
            try {
                res(this.loadImage(readDbmFile(new BinaryStream(bytes)).base64Image));
            } catch {}
        });
    }

    static loadFromParams(params: ImageToolParams): SceneBmpTool {
        //Из данных base64 (требуются размерности)
        if (params.type === "ttDIB2D" || params.type === "ttDOUBLEDIB2D") {
            const tool = new SceneBmpTool(params);
            this.loadImage(params.base64Image)
                .then((image) => tool.setImage(image))
                .catch(() => {
                    const nm = params.type === "ttDIB2D" ? "Битовая карта" : "Двойная битовая карта";
                    console.error(`Не удалось прочитать объект "${nm}" #${params.handle}`);
                });
            return tool;
        }

        //Ссылка на иконку (размерности (вроде) не нужны)
        const tool = new SceneBmpTool(params);
        const fname = params.filename.toUpperCase();
        const imagePr = this.cachedIcons.get(fname);
        if (imagePr) {
            imagePr.then((image) => tool.setImage(image));
        } else if (options.iconsLocation) {
            const url = `${options.iconsLocation}/${fname}`;
            const imagePr = params.type === "ttREFTODIB2D" ? this.loadImage(url) : this.loadDBM(url);
            this.cachedIcons.set(fname, imagePr);
            imagePr.then((image) => tool.setImage(image));
        }
        return tool;
    }

    static loadFromStream(stream: BinaryStream, handle: number, isDouble: boolean): SceneBmpTool | undefined {
        const { base64Image, width, height } = isDouble ? readDbmFile(stream) : readBmpFile(stream);
        const tool = new SceneBmpTool({ handle, width, height });
        const imagePr = this.loadImage(base64Image);
        imagePr
            .then((imageElement) => tool.setImage(imageElement))
            .catch(() => console.error(`Ошибка загрузки изображения ${stream.meta.filepathDos} #${handle}`));
        return tool;
    }
}
