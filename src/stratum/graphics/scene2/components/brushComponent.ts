import { ToolComponent } from "./toolComponent";

export interface BrushComponentArgs {
    handle: number;
    color: number;
    style: number;
    hatch: number;
    rop: number;
}

export class BrushComponent extends ToolComponent<BrushComponent> {
    // private _dibTool: DIBTool | null;
    private _color: number;
    protected colorChanged = true;
    private _style: number;
    protected styleChanged = true;
    private _hatch: number;
    protected hatchChanged = true;
    private _rop: number;
    protected ropChanged = true;

    constructor({ handle, color, style, hatch, rop }: BrushComponentArgs) {
        super(handle);
        this._color = color;
        this._style = style;
        this._hatch = hatch;
        this._rop = rop;
    }

    // dibTool(): DIBTool | null {
    //     return this._dibTool;
    // }

    // setDIB(hdib: number): NumBool {
    //     this._dibTool?.unsubscribe(this);
    //     this._dibTool = this.scene.dibs.get(hdib) || null;
    //     this._dibTool?.subscribe(this);
    //     this.subs.forEach((s) => s.toolChanged(this));
    //     return 1;
    // }
    // dibHandle(): number {
    //     return this._dibTool?.handle || 0;
    // }

    color(): number {
        return this._color;
    }
    setColor(color: number): void {
        this._color = color;
        this.colorChanged = true;
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
    hatch(): number {
        return this._hatch;
    }
    setHatch(hatch: number): void {
        this._hatch = hatch;
        this.hatchChanged = true;
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
