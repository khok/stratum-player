import { colorrefToCSSColor } from "stratum/common/colorrefParsers";
import { Env, NumBool } from "stratum/env";
import { ToolSubscriber } from "./toolSubscriber";

export interface PenToolArgs {
    handle: number;
    color: number;
    style: number;
    width: number;
    rop2: number;
}

export class PenTool implements Env.PenTool {
    private subs: Set<ToolSubscriber>;
    private _color: number;
    private _width: number;
    private _style: number;
    private _rop: number;
    private _cssColor: string;

    handle: number;
    constructor({ handle, color, rop2, style, width }: PenToolArgs) {
        this.handle = handle;
        this.subs = new Set();
        this._color = color;
        this._cssColor = colorrefToCSSColor(color);
        this._width = width;
        this._style = style;
        this._rop = rop2;
    }
    subscribe(sub: ToolSubscriber) {
        this.subs.add(sub);
    }
    unsubscribe(sub: ToolSubscriber) {
        this.subs.delete(sub);
    }
    color(): number {
        return this._color;
    }
    cssColor(): string {
        return this._cssColor;
    }
    setColor(color: number): NumBool {
        this._color = color;
        this._cssColor = colorrefToCSSColor(color);
        this.subs.forEach((s) => s.toolChanged());
        return 1;
    }
    width(): number {
        return this._width;
    }
    setWidth(width: number): NumBool {
        this._width = width;
        this.subs.forEach((s) => s.toolChanged());
        return 1;
    }
    style(): number {
        return this._style;
    }
    setStyle(style: number): NumBool {
        this._style = style;
        return 1;
    }
    rop(): number {
        return this._rop;
    }
    setRop(rop: number): NumBool {
        this._rop = rop;
        return 1;
    }
}
