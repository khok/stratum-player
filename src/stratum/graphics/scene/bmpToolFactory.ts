import { options } from "stratum/api";
import { Base64Image, readDbmFile } from "stratum/fileFormats/bmp";
import { ImageToolParams } from "stratum/fileFormats/vdr";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { SceneBmpTool } from "./tools/sceneBmpTool";

export function loadImage(src: string) {
    return new Promise<HTMLImageElement>((res) => {
        const img = new Image();
        // img.onload = () => setTimeout(() => res(img), Math.random() * 3000); //Имитация медленной загрузки.
        img.onload = () => res(img);
        // img.onerror = () => rej(new Error(`Ошибка чтения ${src}`));
        img.src = src;
    });
}

async function loadDBM(src: string) {
    return new Promise<HTMLImageElement>(async (res) => {
        const data = await fetch(src);
        const bytes = await data.arrayBuffer();
        let dbm: Base64Image;
        try {
            dbm = readDbmFile(new BinaryStream(bytes));
        } catch {
            if (data.status === 200) console.error(`Ошибка чтения ${src}`);
            return;
        }
        const img = await loadImage(dbm.base64Image);
        res(img);
    });
}

export class BmpToolFactory {
    private static cachedIcons = new Map<string, Promise<HTMLImageElement>>();

    static loadFromParams(params: ImageToolParams): SceneBmpTool {
        //Из данных base64 (требуются размерности)
        if (params.type === "ttDIB2D" || params.type === "ttDOUBLEDIB2D") {
            const tool = new SceneBmpTool(params);
            loadImage(params.base64Image)
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
            const imagePr = params.type === "ttREFTODIB2D" ? loadImage(url) : loadDBM(url);
            this.cachedIcons.set(fname, imagePr);
            imagePr.then((image) => tool.setImage(image));
        }
        return tool;
    }
}
