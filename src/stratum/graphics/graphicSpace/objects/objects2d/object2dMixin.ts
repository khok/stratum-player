import { Element2dData } from "data-types-graphics";
import { fabric } from "fabric";
import { Visual2D } from "scene-types";
import { VmBool } from "vm-interfaces-base";
import { GraphicObject } from "..";
import { BaseObjectMixin } from "../baseObjectMixin";

const radToDeg = 180 / Math.PI;

export abstract class Object2dMixin extends BaseObjectMixin {
    protected abstract readonly _subclassInstance: Object2dMixin & GraphicObject;
    abstract readonly type: Element2dData["type"];
    abstract visual: Visual2D;
    private _isVisible: VmBool;
    private _selectable: VmBool;
    positionX: number = 0;
    positionY: number = 0;
    angle = 0;
    width: number = 0;
    height: number = 0;

    constructor(data: Element2dData) {
        super(data);
        const { name, position, size, options } = data;
        this.name = name;
        this._isVisible = options & 0b0001 ? 0 : 1;
        this._selectable = options & 0b1000 ? 0 : 1;
        this.positionX = position.x;
        this.positionY = position.y;
        this.width = size.x;
        this.height = size.y;
        if (data.type === "otTEXT2D") {
            this.angle = data.angle;
        }
    }

    setPosition(x: number, y: number): VmBool {
        this.positionX = x;
        this.positionY = y;
        if (this.isVisible) this.visual.setPosition(x, y);
        if (this.parent) this.parent.handleChildPositionChange(x, y);
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
        const newAngle = this.angle + angleRad * radToDeg;
        if (this.type === "otTEXT2D") this.angle = newAngle;
        this.visual.setAngle(newAngle);
        this.setPosition(point.x, point.y);
        return 1;
    }

    setSize(width: number, height: number): VmBool {
        this.width = width;
        this.height = height;
        //Реализовать
        return 1;
    }

    abstract unsubFromTools(): void;

    destroy() {
        if (this.parent) this.parent.removeItem(this._subclassInstance);
        this.visual.destroy();
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
        if (value) {
            this.visual.show();
            this.visual.setPosition(this.positionX, this.positionY);
        } else {
            this.visual.hide();
        }
    }
}
