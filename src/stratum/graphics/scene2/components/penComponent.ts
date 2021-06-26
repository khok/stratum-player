import { ToolComponent } from "./toolComponent";

export interface PenComponentArgs {
    handle: number;
    color: number;
    width: number;
    style: number;
    rop: number;
}

export class PenComponent extends ToolComponent<PenComponent> {
    private _color: number;
    protected colorChanged = true;
    private _width: number;
    protected widthChanged = true;
    private _style: number;
    protected styleChanged = true;
    private _rop: number;
    protected ropChanged = true;

    constructor({ handle, color, width, style, rop }: PenComponentArgs) {
        super(handle);
        this._color = color;
        this._width = width;
        this._style = style;
        this._rop = rop;
    }

    color(): number {
        return this._color;
    }
    setColor(color: number): void {
        this._color = color;
        this.colorChanged = true;
        this.dispatchChanges();
    }
    width(): number {
        return this._width;
    }
    setWidth(width: number): void {
        this._width = width;
        this.widthChanged = true;
        this.dispatchChanges();
    }
    style(): number {
        return this._style;
    }
    setStyle(style: number): void {
        this._style = style;
        this.styleChanged = true;
        this.dispatchChanges();
    }
    rop(): number {
        return this._rop;
    }
    setRop(rop: number): void {
        this._rop = rop;
        this.ropChanged = true;
        this.dispatchChanges();
    }
}
