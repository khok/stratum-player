import { colorrefToCSSColor } from "stratum/common/colorrefParsers";
import { Env, NumBool } from "stratum/env";
import { TextToolFragment } from "stratum/fileFormats/vdr";
import { FontTool } from "./fontTool";
import { StringTool } from "./stringTool";
import { ToolStorage } from "./toolStorage";
import { ToolSubscriber } from "./toolSubscriber";

export interface TextToolArgs {
    handle: number;
    textCollection: TextToolFragment[];
}

interface InternalTextFragment {
    fgColor: number;
    bgColor: number;
    font: FontTool | null;
    string: StringTool | null;
}

interface PreparedRow {
    elem: string;
    font: string;
    underline: boolean;
    strikeout: boolean;
    width: number;
    height: number;
    fgColor: string;
    bgColor: string;
}

interface PreparedFragment {
    row: PreparedRow[];
    height: number;
}

export class TextTool implements Env.TextTool {
    private subs: Set<ToolSubscriber>;

    private scene: ToolStorage;
    private cnv: HTMLCanvasElement;
    private ctx2: CanvasRenderingContext2D;
    private needUpdatePrepared: boolean;
    private needRedraw: boolean;

    private textCollection: InternalTextFragment[];
    private prepared: PreparedFragment[];
    private _width: number;
    private _height: number;

    handle: number;
    constructor(scene: ToolStorage, { handle, textCollection }: TextToolArgs) {
        this.handle = handle;
        this.subs = new Set();

        this.scene = scene;
        this.cnv = document.createElement("canvas");
        const ctx = this.cnv.getContext("2d", { alpha: true });
        if (!ctx) throw Error("Не удалось инициализировать контекст рендеринга");
        this.ctx2 = ctx;
        this.needUpdatePrepared = true;
        this.needRedraw = true;

        this.textCollection = textCollection.map((t) => {
            const font = scene.fonts.get(t.fontHandle) || null;
            font?.subscribe(this);
            const string = scene.strings.get(t.stringHandle) || null;
            string?.subscribe(this);
            return {
                font,
                string,
                fgColor: t.fgColor,
                bgColor: t.bgColor,
            };
        });
        this.prepared = [];
        this._width = 0;
        this._height = 0;
    }
    subscribe(sub: ToolSubscriber) {
        this.subs.add(sub);
    }
    unsubscribe(sub: ToolSubscriber) {
        this.subs.delete(sub);
    }
    toolChanged() {
        this.needRedraw = true;
        this.needUpdatePrepared = true;
        this.subs.forEach((s) => s.toolChanged());
    }
    textCount(): number {
        return this.textCollection.length;
    }
    fontHandle(index: number): number {
        if (index < 0 || index >= this.textCollection.length) return 0;
        const f = this.textCollection[index].font;
        return f ? f.handle : 0;
    }
    stringHandle(index: number): number {
        if (index < 0 || index >= this.textCollection.length) return 0;
        const s = this.textCollection[index].string;
        return s ? s.handle : 0;
    }
    fgColor(index: number): number {
        if (index < 0 || index >= this.textCollection.length) return 0;
        return this.textCollection[index].fgColor;
    }
    bgColor(index: number): number {
        if (index < 0 || index >= this.textCollection.length) return 0;
        return this.textCollection[index].bgColor;
    }

    private updatePrepared() {
        if (!this.needUpdatePrepared) return;
        const ctx2 = this.ctx2;

        const prep: PreparedFragment[] = [];
        let height = 0;
        let width = 0;

        let rowWidth = 0;
        let rowHeight = 0;
        let row: PreparedRow[] = [];
        for (const frag of this.textCollection) {
            const font = frag.font;
            const str = frag.string;
            if (!font || !str) continue;

            const fgColor = colorrefToCSSColor(frag.fgColor);
            const bgColor = colorrefToCSSColor(frag.bgColor);
            const fontStr = font.toCSSString();
            const h = font.size();

            const spl = str.text().split("\r\n");

            ctx2.font = fontStr;
            let nl = false;
            for (const elem of spl) {
                if (nl) {
                    prep.push({ row, height: rowHeight });
                    width = Math.max(width, rowWidth);
                    height += rowHeight;
                    row = [];
                    rowWidth = 0;
                    rowHeight = 0;
                }
                const w = ctx2.measureText(elem).width;
                row.push({ elem, font: fontStr, width: w, height: h, fgColor, bgColor, underline: font.underline(), strikeout: font.strikeOut() });
                rowWidth += w;
                nl = true;
                rowHeight = Math.max(rowHeight, h);
            }
        }
        prep.push({ row, height: rowHeight });
        width = Math.max(width, rowWidth);
        height += rowHeight;

        this._width = width * 1.01;
        this._height = height * 1.01;
        this.prepared = prep;
        this.needUpdatePrepared = false;
    }

    private redraw() {
        if (!this.needRedraw) return;
        this.updatePrepared();
        this.cnv.width = Math.max(this._width, 1);
        this.cnv.height = Math.max(this._height, 1);

        const ctx2 = this.ctx2;

        // ctx2.fillStyle = "red";
        // ctx2.fillRect(0, 0, this._width, this._height);

        let xpos = 0;
        let ypos = 0;
        for (const { row, height } of this.prepared) {
            xpos = 0;
            ypos += height;
            for (const { elem, font, width: w, height: h, bgColor, fgColor, underline, strikeout } of row) {
                ctx2.font = font;
                ctx2.textAlign = "left";
                ctx2.textBaseline = "ideographic";
                const myHeight = h;
                const offset = (height - myHeight) / 4;
                ctx2.fillStyle = bgColor;
                ctx2.fillRect(xpos, ypos - myHeight - offset, w, myHeight);
                ctx2.fillStyle = fgColor;
                const tstart = ypos - offset + myHeight / 15;
                ctx2.fillText(elem, xpos, tstart);
                const fit = myHeight / 20;
                if (strikeout) {
                    ctx2.fillRect(xpos, ypos - myHeight / 2.5, w, fit);
                }
                if (underline) {
                    ctx2.fillRect(xpos, ypos - fit, w, fit);
                }
                xpos += w;
            }
        }

        this.needRedraw = false;
    }

    render(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, angle: number) {
        this.redraw();
        if (this.cnv.width === 0 || this.cnv.height === 0) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.drawImage(this.cnv, 0, 0, width * 1.02, height * 1.02, 0, 0, width * 1.02, height * 1.02);
        ctx.restore();
    }
    width(): number {
        this.updatePrepared();
        return this._width;
    }
    height(): number {
        this.updatePrepared();
        return this._height;
    }
    setValues(index: number, fontHandle: number, stringHandle: number, fgColor: number, bgColor: number): NumBool {
        if (index < 0 || index >= this.textCollection.length) return 0;
        const frag = this.textCollection[index];
        if (fontHandle > 0 && frag.font?.handle !== fontHandle) {
            frag.font?.unsubscribe(this);
            const f = this.scene.fonts.get(fontHandle) || null;
            f?.subscribe(this);
            frag.font = f;
        }

        if (stringHandle > 0 && frag.string?.handle !== stringHandle) {
            frag.string?.unsubscribe(this);
            const s = this.scene.strings.get(stringHandle) || null;
            s?.subscribe(this);
            frag.string = s;
        }
        frag.fgColor = fgColor;
        frag.bgColor = bgColor;

        this.needUpdatePrepared = true;
        this.needRedraw = true;

        this.subs.forEach((s) => s.toolChanged());
        return 1;
    }
}
