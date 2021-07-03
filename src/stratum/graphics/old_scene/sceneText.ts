import { NumBool } from "stratum/common/types";
import { Hyperbase } from "stratum/fileFormats/vdr";
import { HandleMap } from "stratum/helpers/handleMap";
import { Scene } from "./scene";
import { SceneGroup } from "./sceneGroup";
import { SceneVisualMember } from "./sceneMember";
import { TextTool } from "./tools/textTool";
import { ToolSubscriber } from "./tools/toolSubscriber";

export interface SceneTextArgs {
    handle: number;
    options?: number;
    name?: string;
    hyperbase?: Hyperbase;
    originX: number;
    originY: number;
    width?: number;
    height?: number;
    angle: number;
    textToolHandle: number;
}

export class SceneText implements SceneVisualMember, ToolSubscriber {
    readonly type: 23 = 23;
    private scene: Scene;

    private textTool: TextTool | null;

    private _originX: number;
    private _originY: number;
    private _angle: number;
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

    constructor(scene: Scene, { hyperbase, handle, name, options, originX, originY, width, height, angle, textToolHandle }: SceneTextArgs) {
        this.hyperbase = hyperbase ?? null;
        this.scene = scene;
        this.handle = handle;
        this.name = name || "";

        this.markDeleted = false;
        scene.dirty = true;

        this.textTool = scene.texts.get(textToolHandle) || null;
        this.textTool?.subscribe(this);

        this._originX = originX;
        this._originY = originY;
        this._angle = ((angle / -10) * Math.PI) / 180;
        this._width = width || this.actualWidth();
        this._height = height || this.actualHeight();

        const opts = options || 0;
        // this._visible = opts & 1 ? 0 : 1;
        this._visible = true;
        this._selectable = opts & 8 ? 0 : 1;
        const layerNumber = (opts >> 8) & 0b11111;
        this._layer = 1 << layerNumber;
        this._parent = null;
    }

    toolChanged() {
        this.scene.dirty = true;
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
    height(): number {
        return this._height;
    }
    actualWidth(): number {
        return this.textTool?.width() || 0;
    }
    actualHeight(): number {
        return this.textTool?.height() || 0;
    }
    setSize(width: number, height: number): NumBool {
        if (width < 0 || height < 0) return 0;
        this._width = width;
        this._height = height;
        this._parent?.updateBorders();
        this.scene.dirty = true;
        return 1;
    }

    angle(): number {
        return this._angle;
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

    copy(scene: Scene, attribs: number): SceneText {
        const textToolHandle = this.textTool?.copy(scene).handle ?? 0;

        const handle = HandleMap.getFreeHandle(scene.objects);
        const copy = new SceneText(scene, {
            handle,
            name: this.name,
            originX: this._originX,
            originY: this._originY,
            height: this._height,
            width: this._width,
            angle: this._angle,
            textToolHandle,
        });

        copy.hyperbase = this.hyperbase;
        copy._selectable = this._selectable;
        copy._layer = this._layer;
        copy._visible = this._visible;

        scene.objects.set(handle, copy);
        scene.primaryObjects.push(copy);
        return copy;
    }

    // text methods
    textToolHandle(): number {
        return this.textTool ? this.textTool.handle : 0;
    }

    // scene
    delete(): void {
        this.textTool?.unsubscribe(this);
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

    onParentChanged(parent: SceneGroup | null): void {
        if (parent === this._parent) return;
        this._parent?.removeChild(this);
        this._parent = parent;
    }
    onParentMoved(dx: number, dy: number): void {
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
    onParentRotated(centerX: number, centerY: number, angle: number): void {
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
        this._angle += angle;
        this.scene.dirty = true;
    }

    render(ctx: CanvasRenderingContext2D, sceneX: number, sceneY: number, layers: number): void {
        if (!this.textTool || !this._visible || (this._layer & layers) !== 0) return;
        const x = this._originX - sceneX;
        const y = this._originY - sceneY;
        this.textTool.render(ctx, x, y, this._width, this._height, this._angle);
    }

    tryClick(x: number, y: number, layers: number): SceneGroup | this | undefined {
        if (!this.textTool || !this._visible || (this._layer & layers) !== 0 || this._selectable === 0) return undefined;

        const s = Math.sin(-this._angle);
        const c = Math.cos(-this._angle);

        // translate point back to origin:
        const posx = x - this._originX;
        const posy = y - this._originY;

        // rotate point
        const ox = posx * c - posy * s;
        const oy = posx * s + posy * c;

        if (ox < 0 || oy < 0 || ox > this._width || oy > this._height) return undefined;

        return this._parent ? this._parent.root() : this;
    }

    //#region stubs
    addPoint(): NumBool {
        return 0;
    }
    pointOriginY(): number {
        return 0;
    }
    pointOriginX(): number {
        return 0;
    }
    setPointOrigin(): NumBool {
        return 0;
    }
    penHandle(): number {
        return 0;
    }
    brushHandle(): number {
        return 0;
    }
    controlText(): string {
        return "";
    }
    setControlText(): NumBool {
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
    pointCount(): number {
        return 0;
    }
    itemCount(): number {
        return 0;
    }
    setControlFont(): NumBool {
        return 0;
    }
    //#endregion
}
