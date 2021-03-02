import { options } from "stratum/api";
import { Env, NumBool } from "stratum/env";
import { readDbmFile } from "stratum/fileFormats/bmp";
import { ImageToolParams } from "stratum/fileFormats/vdr";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { ToolSubscriber } from "./toolSubscriber";

export class DIBTool implements Env.DIBTool {
    // private static stubImg: HTMLCanvasElement;
    // static init() {
    //     this.stubImg = document.createElement("canvas");
    //     this.stubImg.width = 1;
    //     this.stubImg.height = 1;
    //     const ctx = this.stubImg.getContext("2d");
    //     if (!ctx) throw Error("Ошибка в граф. системе.");
    //     ctx.fillStyle = "gray";
    //     ctx.fillRect(0, 0, 1, 1);
    // }
    private subs: Set<ToolSubscriber>;
    private img: CanvasRenderingContext2D | null;
    private _pattern: CanvasPattern | null;
    handle: number;
    constructor(args: ImageToolParams) {
        this.handle = args.handle;
        this._pattern = null;
        this.subs = new Set();
        if (args.type === "ttDIB2D" || args.type === "ttDOUBLEDIB2D") {
            this.img = args.img.width > 0 && args.img.height > 0 ? args.img.getContext("2d") : null;
        } else {
            this.img = null;
            const path = options.iconsLocation;
            if (!path) return;

            const url = `${path.endsWith("/") ? path : path + "/"}${args.filename.toUpperCase()}`;

            if (args.type === "ttREFTODIB2D") {
                const img = new Image();
                img.addEventListener("load", () => {
                    if (img.width === 0 || img.height === 0) return;
                    const cnv = document.createElement("canvas");
                    cnv.width = img.width;
                    cnv.height = img.height;
                    const ctx = cnv.getContext("2d", { alpha: false });
                    if (!ctx) throw Error(`Не удалось загрузить изображение ${args.filename}`);
                    ctx.drawImage(img, 0, 0);
                    this.img = cnv.getContext("2d") || null;
                    this.subs.forEach((s) => s.toolChanged());
                });
                img.src = url;
            } else {
                fetch(url)
                    .then((r) => r.arrayBuffer())
                    .then((b) => {
                        const cnv = readDbmFile(new BinaryStream(b, { filepathDos: url }));
                        if (cnv.width === 0 || cnv.height === 0) return;
                        this.img = cnv.getContext("2d") || null;
                        this.subs.forEach((s) => s.toolChanged());
                    });
            }
        }
    }
    subscribe(sub: ToolSubscriber) {
        this.subs.add(sub);
    }
    unsubscribe(sub: ToolSubscriber) {
        this.subs.delete(sub);
    }

    getPixel(x: number, y: number): number {
        if (!this.img) return 0;
        const pixel = this.img.getImageData(x, y, 1, 1).data;
        const r = pixel[0];
        const g = pixel[1] << 8;
        const b = pixel[2] << 16;
        return r | g | b;
    }
    setPixel(x: number, y: number, colorref: number): NumBool {
        if (!this.img) return 1;
        const r = colorref & 255;
        const g = (colorref >> 8) & 255;
        const b = (colorref >> 16) & 255;
        const imgData = this.img.createImageData(1, 1);
        const d = imgData.data;
        d[0] = r;
        d[1] = g;
        d[2] = b;
        d[3] = 255;
        this.img.putImageData(imgData, x, y);
        this.subs.forEach((s) => s.toolChanged());
        return 1;
    }

    pattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
        if (!this.img) return null;
        if (!this._pattern) return (this._pattern = ctx.createPattern(this.img.canvas, "repeat"));
        return this._pattern;
    }

    render(ctx: CanvasRenderingContext2D, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) {
        if (this.img) ctx.drawImage(this.img.canvas, sx, sy, sw, sh, dx, dy, dw, dh);
        // if (!this.img) ctx.drawImage(DIBTool.stubImg, dx, dy, dw, dh);
        // else ctx.drawImage(this.img, sx, sy, sw, sh, dx, dy, dw, dh);
    }

    tryClick(dx: number, dy: number): boolean {
        if (!this.img) return false;
        return this.img.getImageData(dx, dy, 1, 1).data[3] !== 0;
    }

    width(): number {
        return this.img?.canvas.width || 0;
    }

    height(): number {
        return this.img?.canvas.height || 0;
    }
}
// DIBTool.init();
