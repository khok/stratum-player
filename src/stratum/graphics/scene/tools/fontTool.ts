import { Scene } from "../scene";
import { SceneTool } from "./sceneTool";

export interface FontToolArgs {
    handle?: number;
    name?: string;
    style?: number;
}

export class FontTool extends SceneTool<FontTool> {
    protected _name: string;
    protected _size: number;
    protected _style: number;

    constructor(scene: Scene, size: number, { handle, name, style }: FontToolArgs = {}) {
        super(scene, handle);
        this._size = size;
        this._name = name ?? "Arial";
        this._style = style ?? 0;
    }

    name(): string {
        return this._name;
    }

    setName(fontName: string): this {
        this._name = fontName;
        this.dispatchChanges();
        return this;
    }

    size(): number {
        return this._size;
    }

    setSize(size: number): this {
        this._size = size;
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
}
