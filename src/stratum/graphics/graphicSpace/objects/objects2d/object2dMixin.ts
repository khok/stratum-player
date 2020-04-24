import { fabric } from "fabric";
import { PartialOptionalData } from "other-types";
import { Visual2D } from "scene-types";
import { Element2dBaseData, Element2dData } from "vdr-types";
import { VmBool } from "vm-interfaces-core";
import { Object2dBase } from "vm-interfaces-gspace";
import { BaseObjectMixin } from "../baseObjectMixin";

const radToDeg = 180 / Math.PI;

export type Object2dOptions = PartialOptionalData<Element2dBaseData, "name" | "options" | "size">;

export abstract class Object2dMixin extends BaseObjectMixin implements Object2dBase {
    abstract readonly type: Element2dData["type"];
    abstract readonly visual: Visual2D;

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

    get angle() {
        return this.type === "otTEXT2D" ? this._angle : 0;
    }

    rotate(centerX: number, centerY: number, angleRad: number): VmBool {
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

    get zOrder(): number {
        return 1; //TODO: ???
    }

    setZorder(zOrder: number): VmBool {
        // throw new Error("Method not implemented.");
        return 1;
    }

    get isVisible(): VmBool {
        return this._isVisible;
    }

    setVisibility(value: VmBool): VmBool {
        if (value === this._isVisible) return 1;
        this._isVisible = value;
        if (value && this._layerVisible) this.showVisual();
        else this.hideVisual();
        return 1;
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

    get isSelectable(): VmBool {
        return this._selectable;
    }

    private updateLayerVisibility(value: boolean) {
        if (this._layerVisible === value) return;
        this._layerVisible = value;
        if (value) this.showVisual();
        else this.hideVisual();
    }

    setHiddenLayers(value: number) {
        if (this._hiddenLayers === value) return;
        this._hiddenLayers = value;
        this.updateLayerVisibility(!((value >> this._layer) & 1));
    }

    get layer() {
        return this._layer;
    }

    setLayer(value: number) {
        if (this._layer === value) return;
        this._layer = value;
        this.updateLayerVisibility(!((this._hiddenLayers >> value) & 1));
    }
}
