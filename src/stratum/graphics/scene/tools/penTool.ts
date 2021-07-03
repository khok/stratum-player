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
    _color: number;
    _colorVer = 0;
    _width: number;
    _widthVer = 0;
    _style: number;
    _styleVer = 0;
    _rop: number;
    _ropVer = 0;

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
        ++this._colorVer;
        this.dispatchChanges();
        return this;
    }
    width(): number {
        return this._width;
    }
    setWidth(width: number): this {
        this._width = width;
        ++this._widthVer;
        this.dispatchChanges();
        return this;
    }
    style(): number {
        return this._style;
    }
    setStyle(style: number): this {
        this._style = style;
        ++this._styleVer;
        this.dispatchChanges();
        return this;
    }
    rop(): number {
        return this._rop;
    }
    setRop(rop: number): this {
        this._rop = rop;
        ++this._ropVer;
        this.dispatchChanges();
        return this;
    }
}
