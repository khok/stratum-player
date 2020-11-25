import { fabric } from "fabric";
import { Element2dBase, VectorDrawingElement2d } from "stratum/fileFormats/vdr";
import { Optional } from "stratum/helpers/utilityTypes";
import { NumBool } from "stratum/translator";
import { RenderableElement } from "../../interfaces";
import { BaseObjectMixin } from "../baseObjectMixin";

const radToDeg = 180 / Math.PI;

export type Object2dArgs = Optional<Element2dBase, "name" | "options" | "size">;

export abstract class Object2dMixin extends BaseObjectMixin {
    abstract readonly type: VectorDrawingElement2d["type"];
    abstract readonly renderable: RenderableElement;

    positionX: number = 0;
    positionY: number = 0;
    protected _angle = 0;
    width: number = 0;
    height: number = 0;
    private _layerVisible = true;
    private _hiddenLayers = 0;
    private wasShowed: boolean;

    constructor(args: Object2dArgs) {
        super(args);

        const { position, size } = args;
        this.positionX = position.x;
        this.positionY = position.y;
        if (size) {
            this.width = size.x;
            this.height = size.y;
        }
        this.wasShowed = !!this._isVisible;
    }

    setPosition(x: number, y: number): NumBool {
        if (this.positionX === x && this.positionY === y) return 1;
        this.positionX = x;
        this.positionY = y;
        if (this._isVisible && this._layerVisible) this.renderable.setPosition(x, y);
        if (this.parent) this.parent.handleChildTransform(x, y, this.width, this.height);
        return 1;
    }

    setSize(width: number, height: number): NumBool {
        this.width = width;
        this.height = height;
        if (this._isVisible && this._layerVisible) this.renderable.scaleTo(width, height);
        return 1;
    }

    get angle() {
        return this.type === "otTEXT2D" ? this._angle : 0;
    }

    rotate(centerX: number, centerY: number, angleRad: number): NumBool {
        const { positionX, positionY } = this;
        //TODO: убрать зависимость от fabric
        const point = fabric.util.rotatePoint(new fabric.Point(positionX, positionY), new fabric.Point(centerX, centerY), angleRad);
        const newAngle = this._angle + angleRad * radToDeg;
        this._angle = newAngle;
        if (this._isVisible && this._layerVisible) {
            this.renderable.setAngle(newAngle);
            this.setPosition(point.x, point.y);
        }
        return 1;
    }

    get zOrder(): number {
        return 1; //TODO: ???
    }

    setZorder(zOrder: number): NumBool {
        // throw new Error("Method not implemented.");
        return 1;
    }

    get isVisible(): NumBool {
        return this._isVisible;
    }

    setVisibility(value: number): NumBool {
        if (value === this._isVisible) return 1;
        this._isVisible = value !== 0 ? 1 : 0;
        if (value && this._layerVisible) this.showVisual();
        else this.hideVisual();
        return 1;
    }

    private showVisual() {
        this.renderable.show();
        if (this.wasShowed) return;
        this.renderable.setPosition(this.positionX, this.positionY);
        this.renderable.setAngle(this.angle);
        this.renderable.scaleTo(this.width, this.height);
        this.wasShowed = true;
    }

    private hideVisual() {
        this.renderable.hide();
        this.wasShowed = false;
    }

    get isSelectable(): NumBool {
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
