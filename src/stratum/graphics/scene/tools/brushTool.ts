import { colorrefToCSSColor } from "stratum/common/colorrefParsers";
import { Constant } from "stratum/common/constant";
import { NumBool } from "stratum/common/types";
import { DIBTool } from "./dibTool";
import { ToolStorage } from "./toolStorage";
import { ToolSubscriber } from "./toolSubscriber";

export interface BrushToolArgs {
    handle: number;
    color: number;
    style: number;
    hatch: number;
    rop2: number;
    dibHandle: number;
}

export class BrushTool implements ToolSubscriber {
    private scene: ToolStorage;
    private subs: Set<ToolSubscriber>;
    private _dibTool: DIBTool | null;
    private _color: number;
    private _style: number;
    private _hatch: number;
    private _rop: number;
    private _cssColor: string;
    handle: number;

    constructor(scene: ToolStorage, { handle, color, hatch, rop2, style, dibHandle }: BrushToolArgs) {
        this.handle = handle;
        this.subs = new Set();
        this._color = color;
        this._cssColor = colorrefToCSSColor(color);
        this._style = style;
        this._hatch = hatch;
        this._rop = rop2;
        this._dibTool = (dibHandle && scene.dibs.get(dibHandle)) || null;
        this._dibTool?.subscribe(this);
        this.scene = scene;
    }
    toolChanged(): void {
        this.subs.forEach((s) => s.toolChanged(this));
    }

    subscribe(sub: ToolSubscriber) {
        this.subs.add(sub);
    }
    unsubscribe(sub: ToolSubscriber) {
        this.subs.delete(sub);
    }

    dibTool(): DIBTool | null {
        return this._dibTool;
    }

    setDIB(hdib: number): NumBool {
        this._dibTool?.unsubscribe(this);
        this._dibTool = this.scene.dibs.get(hdib) || null;
        this._dibTool?.subscribe(this);
        this.subs.forEach((s) => s.toolChanged(this));
        return 1;
    }
    dibHandle(): number {
        return this._dibTool?.handle || 0;
    }

    color(): number {
        return this._color;
    }
    setColor(color: number): NumBool {
        this._color = color;
        this._cssColor = colorrefToCSSColor(color);
        this.subs.forEach((s) => s.toolChanged(this));
        return 1;
    }
    style(): number {
        return this._style;
    }
    setStyle(style: number): NumBool {
        this._style = style;
        this.subs.forEach((s) => s.toolChanged(this));
        return 1;
    }
    hatch(): number {
        return this._hatch;
    }
    setHatch(hatch: number): NumBool {
        this._hatch = hatch;
        return 1;
    }
    rop(): number {
        return this._rop;
    }
    setRop(rop: number): NumBool {
        this._rop = rop;
        return 1;
    }

    compositeOperation(): string {
        switch (this._rop) {
            case Constant.R2_MASKPEN:
                return "multiply";
            case Constant.R2_NOTXORPEN:
                return "multiply";
            default:
                return "source-over";
        }
    }

    fillStyle(ctx: CanvasRenderingContext2D): string | CanvasPattern | null {
        switch (this._style) {
            case Constant.BS_SOLID:
                return this._cssColor;
            case Constant.BS_NULL:
                return null;
            case Constant.BS_PATTERN:
                return this.dibTool()?.pattern(ctx) ?? "white";
            default:
                return "white";
        }
    }
}
