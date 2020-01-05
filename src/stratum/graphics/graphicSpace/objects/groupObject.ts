import { VmBool } from "vm-interfaces-base";
import { GroupObjectState } from "vm-interfaces-graphics";
import { GraphicObject } from ".";
import { BaseObjectMixin } from "./baseObjectMixin";

//TODO: создать базовый класс для группы и 2д микина и пихнуть туда свойство name и присвоение группы.
export class GroupObject extends BaseObjectMixin implements GroupObjectState {
    protected _subclassInstance: this = this;
    readonly type = "otGROUP2D";
    readonly angle = 0;
    positionX: number = 0;
    positionY: number = 0;
    width: number = 0;
    height: number = 0;
    private myItems: Set<GraphicObject> = new Set();
    constructor(data?: { name?: string; items?: IterableIterator<GraphicObject> }) {
        super({ name: (data && data.name) || "" });
        if (!data) return;
        if (data.items) this.addItems(data.items);
    }

    private recalcCoords() {
        let minX: number | undefined = undefined,
            maxX: number | undefined = undefined,
            minY: number | undefined = undefined,
            maxY: number | undefined = undefined;
        for (const child of this.items) {
            if (minX === undefined || child.positionX < minX) minX = child.positionX;
            if (minY === undefined || child.positionY < minY) minY = child.positionY;
            if (maxX === undefined || child.positionX > maxX) maxX = child.positionX + child.width;
            if (maxY === undefined || child.positionY > maxY) maxY = child.positionY + child.height;
        }
        this.positionX = minX || 0;
        this.positionY = minY || 0;
        this.width = maxX! - minX! || 0;
        this.height = maxY! - minY! || 0;
    }

    //item operations
    get items() {
        return this.myItems.values();
    }

    hasItem(obj: GraphicObject): VmBool {
        return obj.parent === this ? 1 : 0;
    }
    addItem(obj: GraphicObject): VmBool {
        if (this.addItemFast(obj)) this.recalcCoords();
        return 1;
    }

    addItems(items: IterableIterator<GraphicObject>): VmBool {
        for (const it of items) this.addItemFast(it);
        this.recalcCoords();
        return 1;
    }

    private addItemFast(obj: GraphicObject): VmBool {
        if (obj.parent === this) return 0;
        this.myItems.add(obj);
        obj.parent = this;
        return 1;
    }

    removeItem(obj: GraphicObject, iamChild?: boolean): VmBool {
        if (obj.parent !== this) return 0;
        this.myItems.delete(obj);
        this.recalcCoords();
        if (!iamChild) obj.parent = undefined;
        return 1;
    }

    removeAll(): VmBool {
        this.myItems.forEach(o => (o.parent = undefined));
        // this.myItems = new Set(); уже не нужно
        this.recalcCoords();
        return 1;
    }

    destroy() {
        this.removeAll();
    }

    //obj2d operations
    private handleChildChanges = true;
    handleChildPositionChange(childX: number, childY: number) {
        if (!this.handleChildChanges) return;
        if (childX < this.positionX) this.positionX = childX;
        if (childY < this.positionY) this.positionY = childY;
        //также надо пересчитать width, height

        if (this.parent) this.parent.handleChildPositionChange(childX, childY);
    }

    setPosition(x: number, y: number): VmBool {
        const dx = x - this.positionX;
        const dy = y - this.positionY;
        this.handleChildChanges = false;
        for (const item of this.items) item.setPosition(item.positionX + dx, item.positionY + dy);
        this.positionX = x;
        this.positionY = y;
        this.handleChildChanges = true;
        if (this.parent) this.parent.handleChildPositionChange(x, y);
        return 1;
    }
    get zOrder(): number {
        // throw new Error("Method not implemented.");
        return 1; //TODO: ???
    }

    set zOrder(value) {
        // throw new Error("Method not implemented.");
    }

    get isVisible(): VmBool {
        throw new Error("Method not implemented.");
    }

    set isVisible(value) {
        if (!value) throw new Error("Не умею скрывать группы");
    }

    rotate(centerX: number, centerY: number, angleRad: number): VmBool {
        throw new Error("Method not implemented.");
    }
    setSize(width: number, height: number): VmBool {
        throw new Error("Method not implemented.");
    }
}
