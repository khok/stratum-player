import { options } from "stratum/api";
import { crefToB, crefToG, crefToR, rgbToCref } from "stratum/common/colorrefParsers";
import { Env, NumBool } from "stratum/env";
import { readDbmFile } from "stratum/fileFormats/bmp";
import { ImageToolParams } from "stratum/fileFormats/vdr";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { DibToolImage } from "stratum/helpers/types";
import { ToolSubscriber } from "./toolSubscriber";

export class DIBTool implements Env.DIBTool {
    private static promises = new Map<string, Promise<DibToolImage>>();

    static loadBitmap(url: string): Promise<DibToolImage> {
        const r = DIBTool.promises.get(url);
        if (r) return r;

        const p = new Promise<DibToolImage>((res) => {
            const img = new Image();
            img.addEventListener("load", () => {
                const cnv = document.createElement("canvas");
                const ctx = cnv.getContext("2d", { alpha: false });

                if (!ctx || img.width === 0 || img.height === 0) {
                    res(null);
                    return;
                }

                cnv.width = img.width;
                cnv.height = img.height;
                ctx.drawImage(img, 0, 0);
                res(ctx);
            });
            img.addEventListener("error", () => res(null));
            img.src = url;
        });

        this.promises.set(url, p);
        return p;
    }

    static loadDBM(url: string): Promise<DibToolImage> {
        const r = DIBTool.promises.get(url);
        if (r) return r;

        const p = new Promise<DibToolImage>(async (res) => {
            const r = await fetch(url, { cache: "force-cache" });
            const data = await r.arrayBuffer();
            const cnv = readDbmFile(new BinaryStream({ data, name: url }));
            res(cnv);
        });

        DIBTool.promises.set(url, p);
        return p;
    }
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
    private img: DibToolImage;
    private _pattern: CanvasPattern | null;
    handle: number;
    constructor(args: ImageToolParams) {
        this.handle = args.handle;
        this._pattern = null;
        this.subs = new Set();
        if (args.type === "ttDIB2D" || args.type === "ttDOUBLEDIB2D") {
            this.img = args.img;
        } else {
            this.img = null;
            const path = options.iconsLocation;
            if (!path) return;

            const url = `${path.endsWith("/") ? path : path + "/"}${args.filename.toUpperCase()}`;
            const load = args.type === "ttREFTODIB2D" ? DIBTool.loadBitmap : DIBTool.loadDBM;

            load(url).then((ctx) => {
                this.img = ctx;
                this.subs.forEach((s) => s.toolChanged());
            });
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
        return rgbToCref(pixel[0], pixel[1], pixel[2], 0);
    }
    setPixel(x: number, y: number, colorref: number): NumBool {
        if (!this.img) return 1;

        const imgData = this.img.createImageData(1, 1);

        const d = imgData.data;
        d[0] = crefToR(colorref);
        d[1] = crefToG(colorref);
        d[2] = crefToB(colorref);
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
        return this.img?.canvas.width ?? 0;
    }

    height(): number {
        return this.img?.canvas.height ?? 0;
    }
}
// DIBTool.init();
