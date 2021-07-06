import { ToolKeeperComponent } from "../components/toolKeeperComponent";
import { Scene } from "../scene";
import { ImageTool } from "./imageTool";
import { SceneTool } from "./sceneTool";

export interface BrushToolArgs {
    handle?: number;
    color?: number;
    style?: number;
    hatch?: number;
    rop?: number;
    image?: ImageTool;
}

export class BrushTool extends SceneTool<BrushTool> {
    protected _color: number;
    protected _style: number;
    protected _hatch: number;
    protected _rop: number;

    readonly image: ToolKeeperComponent<ImageTool | null>;

    constructor(scene: Scene, { handle, color, style, hatch, rop, image }: BrushToolArgs = {}) {
        super(scene, handle);
        this._color = color ?? 0;
        this._style = style ?? 0;
        this._hatch = hatch ?? 0;
        this._rop = rop ?? 0;
        this.image = new ToolKeeperComponent(scene, image ?? null);
    }

    color(): number {
        return this._color;
    }
    setColor(color: number): void {
        this._color = color;
        this.dispatchChanges();
    }
    style(): number {
        return this._style;
    }
    setStyle(style: number): void {
        this._style = style;
        this.dispatchChanges();
    }
    hatch(): number {
        return this._hatch;
    }
    setHatch(hatch: number): void {
        this._hatch = hatch;
        this.dispatchChanges();
    }
    rop(): number {
        return this._rop;
    }
    setRop(rop: number): void {
        this._rop = rop;
        this.dispatchChanges();
    }
}
