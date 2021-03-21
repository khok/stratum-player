import { NumBool } from "stratum/env";
import { Hyperbase } from "stratum/fileFormats/vdr";
import { Point2D } from "stratum/helpers/types";
import { InputWrapper } from ".";
import { HTMLFactory, Scene, SceneVisualMember } from "./scene";
import { SceneGroup } from "./sceneGroup";

export interface SceneControlArgs {
    handle: number;
    options?: number;
    name?: string;
    hyperbase?: Hyperbase;
    originX: number;
    originY: number;
    width: number;
    height: number;
    className: string;
    text: string;
    dwStyle?: number;
    exStyle?: number;
    id?: number;
    controlSize?: Point2D;
}

export class SceneControl implements SceneVisualMember {
    readonly type = "control";
    private scene: Scene;

    private readonly wrapper: InputWrapper;

    private lastX: number;
    private lastY: number;
    private lastWidth: number;
    private lastHeight: number;
    private lastHidden: boolean;

    private _originX: number;
    private _originY: number;
    private _width: number;
    private _height: number;
    private _visible: boolean;
    private _selectable: number;
    private _layer: number;
    private _parent: SceneGroup | null;

    handle: number;
    name: string;
    markDeleted: boolean;
    hyperbase: Hyperbase | null;

    constructor(scene: Scene, html: HTMLFactory, { hyperbase, handle, options, name, originX, originY, width, height, className, text }: SceneControlArgs) {
        const nm = className.toUpperCase();
        if (nm !== "EDIT") throw Error(`Элемент ввода ${className} не реализован.`);

        this.hyperbase = hyperbase ?? null;

        this.handle = handle;
        this.name = name || "";
        this.scene = scene;

        this.markDeleted = false;
        this._originX = originX;
        this._originY = originY;
        this._width = width;
        this._height = height;

        const opts = options || 0;
        // this._visible = opts & 1 ? 0 : 1;
        this._visible = true;
        this._selectable = opts & 8 ? 0 : 1;
        const layerNumber = (opts >> 8) & 0b11111;
        this._layer = 1 << layerNumber;
        this._parent = null;

        scene.dirty = true;

        this.lastX = originX - scene.originX();
        this.lastY = originY - scene.originY();
        this.lastWidth = width;
        this.lastHeight = height;
        this.lastHidden = !this._visible;

        this.wrapper = html.textInput({ x: this.lastX, y: this.lastY, width, height, text, hidden: this.lastHidden });
        this.wrapper.onEdit((ev) => scene.dispatchControlNotifyEvent(this.handle, ev));
    }

    parentHandle(): number {
        return this._parent?.handle || 0;
    }

    originX(): number {
        const mat = this.scene.invMatrix;
        const realX = this._originX;
        const realY = this._originY;

        const w = realX * mat[2] + realY * mat[5] + mat[8];
        return (realX * mat[0] + realY * mat[3] + mat[6]) / w;
    }
    originY(): number {
        const mat = this.scene.invMatrix;
        const realX = this._originX;
        const realY = this._originY;

        const w = realX * mat[2] + realY * mat[5] + mat[8];
        return (realX * mat[1] + realY * mat[4] + mat[7]) / w;
    }
    setOrigin(x: number, y: number): NumBool {
        const mat = this.scene.matrix;
        const w = x * mat[2] + y * mat[5] + mat[8];
        const realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        const realY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        this._originX = realX;
        this._originY = realY;
        this._parent?.updateBorders();
        this.scene.dirty = true;
        return 1;
    }

    width(): number {
        return this._width;
    }
    actualWidth(): number {
        return this._width;
    }
    height(): number {
        return this._height;
    }
    actualHeight(): number {
        return this._height;
    }
    setSize(width: number, height: number): NumBool {
        if (width < 0 || height < 0) return 0;
        const w = this._width;
        const h = this._height;
        if (w === 0 || h === 0) return 1;
        this.onParentResized(this._originX, this._originY, width / w, height / h);
        this._parent?.updateBorders();
        return 1;
    }

    angle(): number {
        return 0;
    }
    rotate(centerX: number, centerY: number, angle: number): NumBool {
        if (angle === 0) return 1;
        this.onParentRotated(centerX, centerY, angle);
        this._parent?.updateBorders();
        return 1;
    }

    setVisibility(visible: boolean): NumBool {
        this._visible = visible;
        this.scene.dirty = true;
        return 1;
    }

    // control methods
    controlText(): string {
        return this.wrapper.text();
    }
    setControlText(text: string): NumBool {
        this.wrapper.setText(text);
        return 1;
    }

    // scene
    delete() {
        this.wrapper.destroy();
        this._parent?.removeChild(this);
        this.markDeleted = true;
        this.scene.dirty = true;
    }

    getChildByName(name: string): number {
        return this.name === name ? this.handle : 0;
    }

    minX(): number {
        return this._originX;
    }
    minY(): number {
        return this._originY;
    }
    maxX(): number {
        return this._originX + this._width;
    }
    maxY(): number {
        return this._originY + this._height;
    }

    onParentChanged(parent: SceneGroup | null) {
        if (parent === this._parent) return;
        this._parent?.removeChild(this);
        this._parent = parent;
    }

    onParentMoved(dx: number, dy: number) {
        this._originX += dx;
        this._originY += dy;
        this.scene.dirty = true;
    }

    onParentResized(centerX: number, centerY: number, dx: number, dy: number) {
        this._originX = centerX + (this._originX - centerX) * dx;
        this._originY = centerY + (this._originY - centerY) * dy;
        this._width *= dx;
        this._height *= dy;
        this.scene.dirty = true;
    }

    onParentRotated(centerX: number, centerY: number, angle: number) {
        const s = Math.sin(angle);
        const c = Math.cos(angle);

        // translate point back to origin:
        const posx = this._originX - centerX;
        const posy = this._originY - centerY;

        // rotate point
        const xnew = posx * c - posy * s;
        const ynew = posx * s + posy * c;

        // translate point back:
        this._originX = xnew + centerX;
        this._originY = ynew + centerY;
        this.scene.dirty = true;
    }

    render(_: CanvasRenderingContext2D, sceneX: number, sceneY: number, layers: number): void {
        const hidden = !this._visible || (this._layer & layers) !== 0;
        if (hidden !== this.lastHidden) {
            this.lastHidden = hidden;
            this.wrapper.setHidden(hidden);
        }

        const x = this._originX - sceneX;
        const y = this._originY - sceneY;
        if (x !== this.lastX || y !== this.lastY) {
            this.lastX = x;
            this.lastY = y;
            this.wrapper.setOrigin(x, y);
        }

        const width = this._width;
        const height = this._height;
        if (width !== this.lastWidth || height !== this.lastHeight) {
            this.lastWidth = width;
            this.lastHeight = height;
            this.wrapper.setSize(width, height);
        }
    }
    tryClick(x: number, y: number, layers: number): this | SceneGroup | undefined {
        if (!this._visible || (this._layer & layers) !== 0 || this._selectable === 0) return undefined;

        const ox = x - this._originX;
        const oy = y - this._originY;
        if (ox < 0 || oy < 0 || ox > this._width || oy > this._height) return undefined;

        return this._parent ? this._parent.root() : this;
    }

    //#region stubs
    textToolHandle(): number {
        return 0;
    }
    setBitmapRect(): NumBool {
        return 0;
    }
    itemHandle(): number {
        return 0;
    }
    deleteItem(): NumBool {
        return 0;
    }
    pointOriginX(): number {
        return 0;
    }
    pointOriginY(): number {
        return 0;
    }
    setPointOrigin(): NumBool {
        return 0;
    }
    addPoint(): NumBool {
        return 0;
    }
    pointCount(): number {
        return 0;
    }
    penHandle(): number {
        return 0;
    }
    brushHandle(): number {
        return 0;
    }
    deletePoint(): NumBool {
        return 0;
    }
    addItem(): NumBool {
        return 0;
    }
    dibHandle(): number {
        return 0;
    }
    doubleDIBHandle(): number {
        return 0;
    }
    //#endregion
}
