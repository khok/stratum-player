import { Scene } from "../scene";
import { SceneTool } from "./sceneTool";

export interface BrushToolArgs {
    handle?: number;
    color?: number;
    style?: number;
    hatch?: number;
    rop?: number;
}

export class BrushTool extends SceneTool<BrushTool> {
    // private _dibTool: DIBTool | null;
    _color: number;
    _colorVer = 0;
    _style: number;
    _styleVer = 0;
    _hatch: number;
    _hatchVer = 0;
    _rop: number;
    _ropVer = 0;

    constructor(scene: Scene, { handle, color, style, hatch, rop }: BrushToolArgs = {}) {
        super(scene, handle);
        this._color = color ?? 0;
        this._style = style ?? 0;
        this._hatch = hatch ?? 0;
        this._rop = rop ?? 0;
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
        ++this._colorVer;
        this.dispatchChanges();
    }
    style(): number {
        return this._style;
    }
    setStyle(style: number): void {
        this._style = style;
        ++this._styleVer;
        this.dispatchChanges();
    }
    hatch(): number {
        return this._hatch;
    }
    setHatch(hatch: number): void {
        this._hatch = hatch;
        ++this._hatchVer;
        this.dispatchChanges();
    }
    rop(): number {
        return this._rop;
    }
    setRop(rop: number): void {
        this._rop = rop;
        ++this._ropVer;
        this.dispatchChanges();
    }
}
