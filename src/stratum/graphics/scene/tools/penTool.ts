import { Scene } from "../scene";
import { SceneTool } from "./sceneTool";

export interface PenToolArgs {
    handle?: number;
    color?: number;
    width?: number;
    style?: number;
    rop?: number;
}

export class PenTool extends SceneTool<PenTool> {
    protected _color: number;
    protected _width: number;
    protected _style: number;
    protected _rop: number;

    constructor(scene: Scene, { handle, color, width, style, rop }: PenToolArgs = {}) {
        super(scene, handle);
        this._color = color ?? 0;
        this._width = width ?? 1;
        this._style = style ?? 0;
        this._rop = rop ?? 0;
    }

    color(): number {
        return this._color;
    }
    setColor(color: number): this {
        this._color = color;
        this.dispatchChanges();
        return this;
    }
    width(): number {
        return this._width;
    }
    setWidth(width: number): this {
        this._width = width;
        this.dispatchChanges();
        return this;
    }
    style(): number {
        return this._style;
    }
    setStyle(style: number): this {
        this._style = style;
        this.dispatchChanges();
        return this;
    }
    rop(): number {
        return this._rop;
    }
    setRop(rop: number): this {
        this._rop = rop;
        this.dispatchChanges();
        return this;
    }
}
