import { NumBool } from "stratum/common/types";
import { HandleMap } from "stratum/helpers/handleMap";
import { Scene } from "../scene";
import { ToolSubscriber } from "./toolSubscriber";

export interface FontToolArgs {
    handle: number;
    fontName: string;
    // size: number;
    // style: number;
    height?: number;
    weight?: number;
    italic?: number;
    underline?: number;
    strikeOut?: number;
}

export class FontTool {
    private subs: Set<ToolSubscriber>;
    private _name: string;
    private _size: number;
    private _style: number;
    private _cssName: string;

    handle: number;
    constructor({ handle, fontName, height, italic, underline, strikeOut, weight }: FontToolArgs) {
        this.handle = handle;
        this.subs = new Set();

        this._name = fontName;
        this._size = height || 0;
        this._size *= this._size < 0 ? -1 : 1;
        this._style = (italic ? 1 : 0) | (underline ? 2 : 0) | (strikeOut ? 4 : 0) | (weight ? 8 : 0);

        this._cssName = fontName.toUpperCase().endsWith(" CYR") ? fontName.slice(0, fontName.length - 4) : fontName;
    }
    subscribe(sub: ToolSubscriber) {
        this.subs.add(sub);
    }
    unsubscribe(sub: ToolSubscriber) {
        this.subs.delete(sub);
    }
    copy(scene: Scene): FontTool {
        const handle = HandleMap.getFreeHandle(scene.fonts);
        const tool = new FontTool({
            handle,
            fontName: this._name,
            height: this._size,
        });
        tool._style = this._style;
        scene.fonts.set(handle, tool);
        return tool;
    }
    name(): string {
        return this._name;
    }
    setName(fontName: string): NumBool {
        this._name = fontName;
        this._cssName = fontName.endsWith(" CYR") ? fontName.slice(0, fontName.length - 4) : fontName;
        this.subs.forEach((s) => s.toolChanged(this));
        return 1;
    }
    size(): number {
        return this._size;
    }
    setSize(size: number): NumBool {
        this._size = size;
        this.subs.forEach((s) => s.toolChanged(this));
        return 1;
    }
    style(): number {
        return this._style;
    }
    setStyle(flags: number): NumBool {
        this._style = flags;
        this.subs.forEach((s) => s.toolChanged(this));
        return 1;
    }

    underline(): boolean {
        return !!(this._style & 2);
    }
    strikeOut(): boolean {
        return !!(this._style & 4);
    }
    toCSSString() {
        return `${this._style & 8 ? "bold" : ""} ${this._style & 1 ? "italic" : ""} ${this._size}px ${this._cssName}`;
    }
}
