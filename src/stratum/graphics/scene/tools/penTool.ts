import { colorrefToCSSColor } from "stratum/common/colorrefParsers";
import { Constant } from "stratum/common/constant";
import { NumBool } from "stratum/common/types";
import { HandleMap } from "stratum/helpers/handleMap";
import { Scene } from "../scene";
import { ToolSubscriber } from "./toolSubscriber";

export interface PenToolArgs {
    handle: number;
    color: number;
    style: number;
    width: number;
    rop2: number;
}

export class PenTool {
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
    subCount(): number {
        return this.subs.size;
    }
    copy(scene: Scene): PenTool {
        const handle = HandleMap.getFreeHandle(scene.pens);
        const tool = new PenTool({
            handle,
            color: this._color,
            rop2: this._rop,
            style: this._style,
            width: this._width,
        });
        scene.pens.set(handle, tool);
        return tool;
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
    width(): number {
        return this._width;
    }
    setWidth(width: number): NumBool {
        this._width = width;
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
    rop(): number {
        return this._rop;
    }
    setRop(rop: number): NumBool {
        this._rop = rop;
        return 1;
    }

    strokeStyle(): string | null {
        return this._style === Constant.PS_NULL ? null : this._cssColor;
    }
}
