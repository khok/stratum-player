import { NumBool } from "stratum/env";
import { Scene, SceneMember } from "./scene";

export interface GroupArgs {
    handle: number;
    name?: string;
}

export class SceneGroup implements SceneMember {
    readonly type = "group";
    private scene: Scene;

    private children: SceneMember[];

    private _minX: number = 0;
    private _maxX: number = 0;
    private _minY: number = 0;
    private _maxY: number = 0;
    private _parent: SceneGroup | null = null;

    handle: number;
    name: string;
    markDeleted: boolean;

    constructor(scene: Scene, { handle, name }: GroupArgs) {
        this.scene = scene;
        this.handle = handle;
        this.name = name || "";
        this.children = [];
        this.markDeleted = false;
    }

    addChildren(handles: number[]): this {
        if (handles.length === 0) return this;
        this._minX = Infinity;
        this._maxX = -Infinity;
        this._minY = Infinity;
        this._maxY = -Infinity;
        handles.forEach((h) => {
            const obj = this.scene.objects.get(h);
            if (!obj) return; //throw Error(`Объект #${h} не найден на сцене`);
            this._minX = Math.min(this._minX, obj.minX());
            this._minY = Math.min(this._minY, obj.minY());
            this._maxX = Math.max(this._maxX, obj.maxX());
            this._maxY = Math.max(this._maxY, obj.maxY());
            obj.onParentChanged(this);
            this.children.push(obj);
        });
        this._parent?.updateBorders();
        return this;
    }

    root(): SceneGroup {
        let res: SceneGroup = this;
        while (res._parent) res = res._parent;
        return res;
    }

    ungroup() {
        this.markDeleted = true;
        for (const obj of this.children.values()) obj.onParentChanged(null);
        this.onParentChanged(null);
    }

    removeChild(child: SceneMember) {
        if (this.markDeleted) return;
        this.children = this.children.filter((c) => c.handle !== child.handle);
        if (this.children.length === 0) {
            this._minX = 0;
            this._maxX = 0;
            this._minY = 0;
            this._maxY = 0;
        }
        this.updateBorders();
    }

    updateBorders() {
        if (this.children.length === 0) return;
        this._minX = Infinity;
        this._maxX = -Infinity;
        this._minY = Infinity;
        this._maxY = -Infinity;
        for (const obj of this.children.values()) {
            this._minX = Math.min(this._minX, obj.minX());
            this._minY = Math.min(this._minY, obj.minY());
            this._maxX = Math.max(this._maxX, obj.maxX());
            this._maxY = Math.max(this._maxY, obj.maxY());
        }
        this._parent?.updateBorders();
    }

    parentHandle(): number {
        return this._parent?.handle || 0;
    }

    originX(): number {
        const mat = this.scene.invMatrix;
        const realX = this._minX;
        const realY = this._minY;

        const w = realX * mat[2] + realY * mat[5] + mat[8];
        return (realX * mat[0] + realY * mat[3] + mat[6]) / w;
    }
    originY(): number {
        const mat = this.scene.invMatrix;
        const realX = this._minX;
        const realY = this._minY;

        const w = realX * mat[2] + realY * mat[5] + mat[8];
        return (realX * mat[1] + realY * mat[4] + mat[7]) / w;
    }
    setOrigin(x: number, y: number): NumBool {
        const mat = this.scene.matrix;
        const w = x * mat[2] + y * mat[5] + mat[8];
        const realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        const realY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        this.onParentMoved(realX - this._minX, realY - this._minY);
        this._parent?.updateBorders();
        return 1;
    }

    width(): number {
        return this._maxX - this._minX;
    }
    actualWidth(): number {
        return this._maxX - this._minX;
    }
    height(): number {
        return this._maxY - this._minY;
    }
    actualHeight(): number {
        return this._maxY - this._minY;
    }
    setSize(width: number, height: number): NumBool {
        if (width < 0 || height < 0) return 0;
        const w = this.width();
        const h = this.height();
        if (w === 0 || h === 0) return 1;
        this.onParentResized(this._minX, this._minY, width / w, height / h);
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

    setShow(visible: number): NumBool {
        for (const c of this.children.values()) c.setShow(visible);
        return 1;
    }

    // group methods
    itemHandle(index: number): number {
        if (index < 0 || index >= this.children.length) return 0;
        return this.children[index].handle;
    }
    addItem(itemHandle: number): NumBool {
        const child = this.scene.objects.get(itemHandle);
        if (!child || this.children.some((c) => c.handle === itemHandle)) return 0;
        child.onParentChanged(this);
        this.children.push(child);
        this.updateBorders();
        return 1;
    }
    deleteItem(itemHandle: number): NumBool {
        const child = this.children.find((c) => c.handle === itemHandle);
        if (!child) return 0;
        // этот метод должен вызывать removeChild
        child.onParentChanged(null);
        return 1;
    }

    // scene
    delete() {
        this.markDeleted = true;
        for (const obj of this.children.values()) obj.delete();
        this.onParentChanged(null);
    }

    getChildByName(name: string): number {
        if (this.name === name) return this.handle;
        for (const obj of this.children.values()) {
            const res = obj.getChildByName(name);
            if (res !== 0) return res;
        }
        return 0;
    }

    minX(): number {
        return this._minX;
    }
    minY(): number {
        return this._minY;
    }
    maxX(): number {
        return this._maxX;
    }
    maxY(): number {
        return this._maxY;
    }
    onParentChanged(parent: SceneGroup | null): void {
        if (parent === this._parent) return;
        {
            // защита от рекурсии
            let p = parent;
            while (p) {
                if (p === this) return;
                p = p._parent;
            }
        }
        this._parent?.removeChild(this);
        this._parent = parent;
    }
    onParentMoved(dx: number, dy: number) {
        if (this.children.length === 0) return;
        for (const c of this.children.values()) c.onParentMoved(dx, dy);
        this._minX += dx;
        this._minY += dy;
        this._maxX += dx;
        this._maxY += dy;
    }
    onParentResized(centerX: number, centerY: number, dx: number, dy: number): void {
        if (this.children.length === 0) return;
        this._minX = Infinity;
        this._maxX = -Infinity;
        this._minY = Infinity;
        this._maxY = -Infinity;
        for (const obj of this.children.values()) {
            obj.onParentResized(centerX, centerY, dx, dy);
            this._minX = Math.min(this._minX, obj.minX());
            this._minY = Math.min(this._minY, obj.minY());
            this._maxX = Math.max(this._maxX, obj.maxX());
            this._maxY = Math.max(this._maxY, obj.maxY());
        }
    }
    onParentRotated(centerX: number, centerY: number, angle: number): void {
        if (this.children.length === 0) return;
        this._minX = Infinity;
        this._maxX = -Infinity;
        this._minY = Infinity;
        this._maxY = -Infinity;
        for (const obj of this.children.values()) {
            obj.onParentRotated(centerX, centerY, angle);
            this._minX = Math.min(this._minX, obj.minX());
            this._minY = Math.min(this._minY, obj.minY());
            this._maxX = Math.max(this._maxX, obj.maxX());
            this._maxY = Math.max(this._maxY, obj.maxY());
        }
    }

    //#region stubs
    addPoint(): NumBool {
        return 0;
    }
    deletePoint(): NumBool {
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
    textToolHandle(): number {
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
    dibHandle(): number {
        return 0;
    }
    doubleDIBHandle(): number {
        return 0;
    }
    //#endregion
}
