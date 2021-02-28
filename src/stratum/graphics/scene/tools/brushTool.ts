import { colorrefToCSSColor } from "stratum/common/colorrefParsers";
import { Env, NumBool } from "stratum/env";
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

export class BrushTool implements Env.BrushTool {
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
    style(): number {
        return this._style;
    }
    setStyle(style: number): NumBool {
        this._style = style;
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
}
