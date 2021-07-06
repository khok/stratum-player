import { ToolKeeperComponent } from "./components/toolKeeperComponent";
import { GroupElement2D } from "./elements/groupElement2d";
import { ImageElement2D } from "./elements/imageElement2d";
import { InputElement2D } from "./elements/inputElement2d";
import { LineElement2D } from "./elements/lineElement2d";
import { TextElement2D } from "./elements/textElement2d";
import { BrushTool } from "./tools/brushTool";

export type PrimaryElement = LineElement2D | ImageElement2D | TextElement2D | InputElement2D;
export type SceneElement = PrimaryElement | GroupElement2D;

export interface SceneArgs {
    offsetX?: number;
    offsetY?: number;
    layers?: number;
}

export type ScenePointerEventType = "pointermove" | "pointerdown" | "pointerup";
export type SceneKeyboardEventType = "keydown" | "keyup" | "keychar";
export type SceneInputEventType = "input" | "focus" | "blur";

export interface ScenePointerEvent {
    type: ScenePointerEventType;
    target: Scene;
    element: PrimaryElement | null;
    x: number;
    y: number;
    buttons: number;
    button: number;
    clickX: number;
    clickY: number;
}

export interface SceneKeyboardEvent {
    type: SceneKeyboardEventType;
    target: Scene;
    key: number;
    repeat: number;
    scan: number;
}

export interface ScenePointerEventCallback {
    (evt: ScenePointerEvent): void;
}

export interface SceneKeyboardEventCallback {
    (evt: SceneKeyboardEvent): void;
}

export interface SceneInputEvent {
    type: SceneInputEventType;
    target: Scene;
    element: InputElement2D;
}

export interface SceneInputEventCallback {
    (evt: SceneInputEvent): void;
}

export abstract class Scene {
    static readonly keyState = new Uint8Array(256);

    _elements: readonly PrimaryElement[] = [];
    _elementsVer: number = 0;

    _offsetX: number;
    _offsetY: number;
    _offsetVer: number = 0;

    _dirty: boolean = true;

    _layers: number;

    abstract readonly view: Element;

    readonly brush = new ToolKeeperComponent<BrushTool | null>(this, null);

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

    abstract mouseCoords(): [number, number];
    abstract setCapture(): this;
    abstract releaseCapture(): this;

    abstract on(event: ScenePointerEventType, callback: ScenePointerEventCallback): this;
    abstract on(event: SceneKeyboardEventType, callback: SceneKeyboardEventCallback): this;
    abstract on(event: "inputState", callback: SceneInputEventCallback): this;
    abstract off(event: ScenePointerEventType, callback?: ScenePointerEventCallback): this;
    abstract off(event: SceneKeyboardEventType, callback?: SceneKeyboardEventCallback): this;
    abstract off(event: "inputState", callback?: SceneInputEventCallback): this;

    abstract beforeRemove(): void;

    abstract elementAtPoint(x: number, y: number): PrimaryElement | null;
}
