import { fabric } from "fabric";
import { StratumError } from "../errors";
import { GraphicObjectFunctions, VmBool } from "../vm/types";
import { Element2d, Group, HandleMap } from "./types";
import { VectorDrawInstance } from "./vectorDrawInstance";

export type ElementInstance = Element2dInstance | GroupInstance;

export class Element2dInstance implements GraphicObjectFunctions {
    name: string;
    positionX: number = 0;
    positionY: number = 0;
    group?: GroupInstance;
    constructor(private scene: VectorDrawInstance, private obj: fabric.Object, element: Element2d) {
        this.name = element.name;
        this.setVisibility(element.options & 0x0001 ? 0 : 1);
        this.setPosition(element.position.x, element.position.y);
    }
    setPosition(x: number, y: number): VmBool {
        this.positionX = x;
        this.positionY = y;
        this.updateVisualPosition();
        if (this.group) this.group.handleChildPositionChange(x, y);
        return 1;
    }
    updateVisualPosition() {
        const { positionX, positionY } = this;
        this.scene.requestRedraw();
        this.obj.set({ left: positionX - this.scene.originX, top: positionY - this.scene.originY }).setCoords();
    }
    rotate(centerX: number, centerY: number, angleRad: number): VmBool {
        // console.log(angleRad);
        const { positionX, positionY } = this;
        const point = fabric.util.rotatePoint(
            new fabric.Point(positionX, positionY),
            new fabric.Point(centerX, centerY),
            angleRad
        );
        this.obj.angle = (this.obj.angle || 0) + angleRad * 57.2958;
        this.setPosition(point.x, point.y);
        return 1;
        // throw new Error("Method not implemented.");
    }

    addToGroup(group: GroupInstance) {
        this.group = group;
    }

    get parentHandle() {
        if (!this.group) return 0;
        const data = this.scene.getObjectData(this.group);
        return data ? data.handle : 0;
    }

    get width() {
        return this.obj.getScaledWidth();
    }
    get height() {
        return this.obj.getScaledHeight();
    }

    setSize(width: number, height: number): VmBool {
        throw new Error("Method not implemented.");
    }

    get zOrder(): number {
        throw new Error("Method not implemented.");
    }

    setZOrder(zOrder: number): VmBool {
        throw new Error("Method not implemented.");
    }
    setVisibility(visible: VmBool): VmBool {
        this.scene.requestRedraw();
        this.obj.visible = !!visible;
        return 1;
    }
}

export class GroupInstance implements GraphicObjectFunctions {
    name: string;
    parentHandle: number = 0;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    items = new Array<ElementInstance>();
    group?: GroupInstance;

    constructor({ childHandles, name }: Group, childs: HandleMap<ElementInstance>) {
        this.name = name;
        let minX: number | undefined = undefined,
            maxX: number | undefined = undefined,
            minY: number | undefined = undefined,
            maxY: number | undefined = undefined;
        for (const childHandle of childHandles) {
            const child = childs.get(childHandle);
            if (!child) throw new StratumError(`Объекта #${childHandle} нет на схеме`);
            child.addToGroup(this);
            this.items.push(child);
            if (minX == undefined || child.positionX < minX) minX = child.positionX;
            if (minY == undefined || child.positionY < minY) minY = child.positionY;
            if (maxX == undefined || child.positionX > maxX) maxX = child.positionX + child.width;
            if (maxY == undefined || child.positionY > maxY) maxY = child.positionY + child.height;
        }
        this.positionX = minX || 0;
        this.positionY = minY || 0;
        this.width = maxX! - minX! || 0;
        this.height = maxY! - minY! || 0;
    }

    addToGroup(group: GroupInstance) {
        this.group = group;
    }
    handleChildChanges = true;
    handleChildPositionChange(childX: number, childY: number) {
        if (!this.handleChildChanges) return;
        if (childX < this.positionX) this.positionX = childX;
        if (childY < this.positionY) this.positionY = childY;
        //также надо пересчитать width, height

        if (this.group) this.group.handleChildPositionChange(childX, childY);
    }

    setPosition(x: number, y: number): VmBool {
        const dx = x - this.positionX;
        const dy = y - this.positionY;
        this.handleChildChanges = false;
        this.items.forEach(c => c.setPosition(c.positionX + dx, c.positionY + dy));
        this.positionX = x;
        this.positionY = y;
        this.handleChildChanges = true;
        if (this.group) this.group.handleChildPositionChange(x, y);
        return 1;
    }
    rotate(centerX: number, centerY: number, angleRad: number): VmBool {
        throw new Error("Method not implemented.");
    }
    setSize(width: number, height: number): VmBool {
        throw new Error("Method not implemented.");
    }
    get zOrder(): number {
        return 1; //REL
        // throw new Error("Method not implemented.");
    }
    setZOrder(zOrder: number): VmBool {
        throw new Error("Method not implemented.");
    }
    setVisibility(visible: VmBool): VmBool {
        return 1; //REL
    }
}
