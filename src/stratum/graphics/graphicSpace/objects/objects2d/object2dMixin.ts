import { Element2dData, Point2D } from "vdr-types";
import { fabric } from "fabric";
import { Visual2D } from "scene-types";
import { VmBool } from "vm-interfaces-core";
import { GraphicObject } from "..";
import { BaseObjectMixin } from "../baseObjectMixin";

const radToDeg = 180 / Math.PI;

export interface Object2dOptions {
    handle: number;
    name?: string;
    position: Point2D;
    size?: Point2D;
    options?: number;
}

export abstract class Object2dMixin extends BaseObjectMixin {
    protected abstract readonly _subclassInstance: Object2dMixin & GraphicObject;
    abstract readonly type: Element2dData["type"];
    abstract visual: Visual2D;
    private _isVisible: VmBool = 1;
    private _selectable: VmBool = 1;

    positionX: number = 0;
    positionY: number = 0;
    protected _angle = 0;
    width: number = 0;
    height: number = 0;

    constructor(data: Object2dOptions) {
        super(data);

        const { position, size, options } = data;
        this.positionX = position.x;
        this.positionY = position.y;
        if (options) {
            this._isVisible = options & 0b0001 ? 0 : 1;
            this._selectable = options & 0b1000 ? 0 : 1;
        }
        if (size) {
            this.width = size.x;
            this.height = size.y;
        }
    }

    get angle() {
        return this.type === "otTEXT2D" ? this._angle : 0;
    }

    setPosition(x: number, y: number): VmBool {
        if (this.positionX === x && this.positionY === y) return 1;
        this.positionX = x;
        this.positionY = y;
        if (this.isVisible) this.visual.setPosition(x, y);
        if (this.parent) this.parent.handleChildTransform(x, y, this.width, this.height);
        return 1;
    }

    setSize(width: number, height: number): VmBool {
        this.width = width;
        this.height = height;
        this.visual.scaleTo(width, height);
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
        this.visual.setAngle(newAngle);
        this.setPosition(point.x, point.y);
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

    get isVisible(): VmBool {
        return this._isVisible;
    }

    get selectable(): VmBool {
        return this._selectable;
    }

    set isVisible(value) {
        if (value === this._isVisible) return;
        this._isVisible = value;
        if (value) {
            this.visual.show();
            this.visual.setPosition(this.positionX, this.positionY);
        } else {
            this.visual.hide();
        }
    }
}
