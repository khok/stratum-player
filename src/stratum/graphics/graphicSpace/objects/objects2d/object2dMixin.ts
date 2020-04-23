import { fabric } from "fabric";
import { Visual2D } from "scene-types";
import { Element2dData, Point2D } from "vdr-types";
import { VmBool } from "vm-interfaces-core";
import { GraphicObject } from "..";
import { BaseObjectMixin, ObjectOptions } from "../baseObjectMixin";

const radToDeg = 180 / Math.PI;

export interface Object2dOptions extends ObjectOptions {
    position: Point2D;
    size?: Point2D;
}

export abstract class Object2dMixin extends BaseObjectMixin {
    protected abstract readonly _subclassInstance: Object2dMixin & GraphicObject;

    abstract readonly type: Element2dData["type"];
    abstract visual: Visual2D;

    positionX: number = 0;
    positionY: number = 0;
    protected _angle = 0;
    width: number = 0;
    height: number = 0;
    private _layerVisible = true;
    private _hiddenLayers = 0;
    private wasShowed: boolean;

    constructor(data: Object2dOptions) {
        super(data);

        const { position, size } = data;
        this.positionX = position.x;
        this.positionY = position.y;
        if (size) {
            this.width = size.x;
            this.height = size.y;
        }
        this.wasShowed = !!this._isVisible;
    }

    get angle() {
        return this.type === "otTEXT2D" ? this._angle : 0;
    }

    setPosition(x: number, y: number): VmBool {
        if (this.positionX === x && this.positionY === y) return 1;
        this.positionX = x;
        this.positionY = y;
        if (this._isVisible && this._layerVisible) this.visual.setPosition(x, y);
        if (this.parent) this.parent.handleChildTransform(x, y, this.width, this.height);
        return 1;
    }

    setSize(width: number, height: number): VmBool {
        this.width = width;
        this.height = height;
        if (this._isVisible && this._layerVisible) this.visual.scaleTo(width, height);
        return 1;
    }

    rotate(centerX: number, centerY: number, angleRad: number): VmBool {
        // console.log(angleRad);
        const { positionX, positionY } = this;
        //TODO: убрать зависимость от fabric
        const point = fabric.util.rotatePoint(
            new fabric.Point(positionX, positionY),
            new fabric.Point(centerX, centerY),
            angleRad
        );
        const newAngle = this._angle + angleRad * radToDeg;
        this._angle = newAngle;
        if (this._isVisible && this._layerVisible) {
            this.visual.setAngle(newAngle);
            this.setPosition(point.x, point.y);
        }
        return 1;
    }

    protected abstract unsubFromTools(): void;
    destroy() {
        if (this.parent) this.parent.removeItem(this._subclassInstance);
        this.unsubFromTools();
    }

    get zOrder(): number {
        //TODO: fix;
        return 1;
    }

    set zOrder(value) {
        // throw new Error("Method not implemented.");
    }

    private showVisual() {
        this.visual.show();
        if (this.wasShowed) return;
        this.visual.setPosition(this.positionX, this.positionY);
        this.visual.setAngle(this.angle);
        this.visual.scaleTo(this.width, this.height);
        this.wasShowed = true;
    }

    private hideVisual() {
        this.visual.hide();
        this.wasShowed = false;
    }

    get isVisible(): VmBool {
        return this._isVisible;
    }

    set isVisible(value) {
        if (value === this._isVisible) return;
        this._isVisible = value;
        if (value && this._layerVisible) this.showVisual();
        else this.hideVisual();
    }

    get isSelectable(): VmBool {
        return this._selectable;
    }

    private updateLayerVisibility(value: boolean) {
        if (this._layerVisible === value) return;
        this._layerVisible = value;
        if (value) this.showVisual();
        else this.hideVisual();
    }

    set hiddenLayers(value: number) {
        if (this._hiddenLayers === value) return;
        this._hiddenLayers = value;
        this.updateLayerVisibility(!((value >> this._layer) & 1));
    }

    get layer() {
        return this._layer;
    }

    set layer(value: number) {
        if (this._layer === value) return;
        this._layer = value;
        this.updateLayerVisibility(!!(this._hiddenLayers >> value));
    }
}
