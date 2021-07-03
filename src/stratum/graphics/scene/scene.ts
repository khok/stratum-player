import { ToolKeeperComponent } from "./components/toolKeeperComponent";
import { GroupElement2D } from "./elements/groupElement2d";
import { LineElement2D } from "./elements/lineElement2d";
import { BrushTool } from "./tools/brushTool";

export type PrimaryElement = LineElement2D;
export type SceneElement = PrimaryElement | GroupElement2D;

export interface SceneArgs {
    offsetX?: number;
    offsetY?: number;
    layers?: number;
}

export abstract class Scene {
    _elements: readonly PrimaryElement[] = [];
    _elementsVer: number = 0;

    _offsetX: number;
    _offsetY: number;
    _offsetVer: number = 0;

    _dirty: boolean = true;

    _layers: number;

    abstract readonly view: Element;

    readonly brush = new ToolKeeperComponent<BrushTool>(this);

    constructor(args: SceneArgs = {}) {
        this._offsetX = args.offsetX ?? 0;
        this._offsetY = args.offsetY ?? 0;
        this._layers = args.layers ?? 0;
    }

    layers(): number {
        return this._layers;
    }

    setLayers(layers: number): this {
        if (layers === this._layers) return this;
        this._layers = layers;
        this._dirty = true;
        return this;
    }

    elements(): readonly PrimaryElement[] {
        return this._elements;
    }

    setElements(elements: readonly PrimaryElement[]): this {
        this._elements = elements;
        ++this._elementsVer;
        this._dirty = true;
        return this;
    }

    offsetX(): number {
        return this._offsetX;
    }

    offsetY(): number {
        return this._offsetY;
    }

    setOffset(x: number, y: number): this {
        this._offsetX = x;
        this._offsetY = y;
        ++this._offsetVer;
        this._dirty = true;
        return this;
    }

    setCapture(): this {
        return this;
    }

    releaseCapture(): this {
        return this;
    }

    abstract elementAtPoint(x: number, y: number): PrimaryElement | null;
}
