import { NotImplementedError } from "stratum/helpers/errors";
import { GroupObject } from "stratum/vm/interfaces/graphicSpaceObjects";
import { NumBool } from "stratum/vm/types";
import { SceneObject, SceneObject2d } from ".";
import { BaseObjectMixin, ObjectArgs } from "./baseObjectMixin";

export interface SceneGroupObjectArgs extends ObjectArgs {
    items?: SceneObject[];
}

export class SceneGroupObject extends BaseObjectMixin implements GroupObject {
    readonly type = "otGROUP2D";
    readonly angle = 0;
    positionX: number = 0;
    positionY: number = 0;
    width: number = 0;
    height: number = 0;
    items: SceneObject[] = [];

    constructor(args: SceneGroupObjectArgs) {
        super(args);
        if (args.items && args.items.length !== 0) this.addItems(args.items);
    }

    private recalcCoords() {
        let minX: number | undefined = undefined,
            maxX: number | undefined = undefined,
            minY: number | undefined = undefined,
            maxY: number | undefined = undefined;
        for (const child of this.items) {
            if (!child.isVisible) continue;
            if (minX === undefined || child.positionX < minX) minX = child.positionX;
            if (minY === undefined || child.positionY < minY) minY = child.positionY;
            if (maxX === undefined || child.positionX + child.width > maxX) maxX = child.positionX + child.width;
            if (maxY === undefined || child.positionY + child.height > maxY) maxY = child.positionY + child.height;
        }
        this.positionX = minX || 0;
        this.positionY = minY || 0;
        this.width = maxX! - minX! || 0;
        this.height = maxY! - minY! || 0;
        if (this.parent) this.parent.recalcCoords();
    }

    //item operations
    getItem(index: number): SceneObject | undefined {
        return this.items[index];
    }

    hasItem(obj: SceneObject): NumBool {
        return obj.parent === this ? 1 : 0;
    }

    private addItemFast(obj: SceneObject): NumBool {
        if (obj.parent === this) return 0;
        if (!this.items.includes(obj)) this.items.push(obj);
        obj._parent = this;
        return 1;
    }

    addItem(obj: SceneObject): NumBool {
        if (this.addItemFast(obj)) this.recalcCoords();
        return 1;
    }

    addItems(items: SceneObject[]): NumBool {
        for (const it of items) this.addItemFast(it);
        this.recalcCoords();
        return 1;
    }

    removeItem(obj: SceneObject): NumBool {
        if (obj.parent !== this) return 0;
        obj._parent = undefined;
        const index = this.items.indexOf(obj);
        if (index < 0) return 0;
        this.items.splice(index, 1);
        this.recalcCoords();
        return 1;
    }

    getItemsRecursive(items?: SceneObject2d[]) {
        if (!items) items = [];
        for (const item of this.items) {
            if (item.type === "otGROUP2D") item.getItemsRecursive(items);
            else items.push(item);
        }
        return items;
    }

    //obj2d operations
    private handleChildChanges = true;
    handleChildTransform(childX: number, childY: number, childWidth: number, childHeight: number) {
        if (!this.handleChildChanges) return;
        if (childX < this.positionX) this.positionX = childX;
        if (childY < this.positionY) this.positionY = childY;
        if (childX + childWidth > this.positionX + this.width) this.width = childX + childWidth - this.positionX;
        if (childY + childHeight > this.positionY + this.height) this.height = childY + childHeight - this.positionY;

        if (this.parent) this.parent.handleChildTransform(childX, childY, childWidth, childHeight);
    }

    setPosition(x: number, y: number): NumBool {
        if (this.positionX === x && this.positionY === y) return 1;
        const dx = x - this.positionX;
        const dy = y - this.positionY;
        this.handleChildChanges = false;
        for (const item of this.items) item.setPosition(item.positionX + dx, item.positionY + dy);
        this.handleChildChanges = true;
        this.positionX = x;
        this.positionY = y;
        if (this.parent) this.parent.handleChildTransform(x, y, this.width, this.height);
        return 1;
    }

    setSize(width: number, height: number): NumBool {
        if (this.width === width && this.height === height) return 1;
        const dx = width / this.width;
        const dy = height / this.height;
        this.handleChildChanges = false;
        for (const item of this.items) item.setSize(item.width * dx, item.height * dy);
        this.handleChildChanges = true;
        this.width = width;
        this.height = height;
        if (this.parent) this.parent.handleChildTransform(this.positionX, this.positionY, width, height);
        return 1;
    }

    rotate(centerX: number, centerY: number, angleRad: number): NumBool {
        this.handleChildChanges = false;
        for (const item of this.items) item.rotate(centerX, centerY, angleRad);
        this.handleChildChanges = true;
        if (this.parent) this.parent.handleChildTransform(this.positionX, this.positionY, this.width, this.height);
        return 1;
    }

    get zOrder(): number {
        // throw new Error("Method not implemented.");
        return 1; //TODO: ???
    }

    setZorder(zOrder: number): NumBool {
        // throw new Error("Method not implemented.");
        return 1;
    }

    get isVisible(): NumBool {
        return 1;
    }

    setVisibility(value: NumBool): NumBool {
        if (!value) throw new NotImplementedError("Попытка скрыть объект-группу.");
        else return 1;
    }

    removeAllItems() {
        //удаляем быстрым спосбом
        this.items.forEach((o) => (o._parent = undefined));
        this.items = [];
    }
}
