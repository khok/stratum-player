import { fabric } from "fabric";
import { GraphicSpaceFunctions, VmBool } from "../vm/types";
import { Element2dInstance, ElementInstance, GroupInstance } from "./graphicObject";
import { instantiateObject } from "./instantiateObject";
import { Group, HandleMap, VectorDrawData } from "./types";

export class VectorDrawInstance implements GraphicSpaceFunctions {
    getObjectData(object: ElementInstance) {
        return this.objectDataMap.get(object);
    }
    private objects: HandleMap<ElementInstance> = new Map();
    private visuals: HandleMap<fabric.Object> = new Map();
    private objectDataMap = new WeakMap<ElementInstance, { handle: number }>();
    private canvas: fabric.Canvas;
    private shouldRedraw = false;
    constructor(image: VectorDrawData, htmlCanvas: HTMLCanvasElement) {
        this.setOrigin(image.origin.x, image.origin.y);
        if (image.elements) {
            //делим на два цикла, т.к. сперва надо создать все объекты, только затем - группы
            const groups: { handle: number; group: Group }[] = [];
            for (const [handle, value] of image.elements) {
                if (value.type == "group") {
                    groups.push({ handle, group: value });
                    continue;
                }
                const visual = instantiateObject(value, image);
                this.visuals.set(handle, visual);
                const obj = new Element2dInstance(this, visual, value);
                this.objects.set(handle, obj);
                this.objectDataMap.set(obj, { handle });
            }
            let allGroupsCreated = false;
            while (!allGroupsCreated) {
                allGroupsCreated = true;
                for (const { handle, group } of groups) {
                    if (group.childHandles.some(h => !this.objects.has(h))) {
                        allGroupsCreated = false;
                        continue;
                    }
                    const obj = new GroupInstance(group, this.objects);
                    this.objects.set(handle, obj);
                    this.objectDataMap.set(obj, { handle });
                }
            }
        }
        this.canvas = new fabric.Canvas(htmlCanvas, {
            preserveObjectStacking: true
        });
        if (image.elementOrder) {
            image.elementOrder.forEach(h => {
                const obj = this.visuals.get(h);
                if (obj) this.canvas.add(obj);
            });
        }
    }

    requestRedraw() {
        this.shouldRedraw = true;
    }

    getObject(objectHandle: number): ElementInstance | undefined {
        return this.objects.get(objectHandle);
    }

    findObjectHandleByName(groupHandle: number, objectName: string): number {
        if (groupHandle == 0) {
            for (const [h, { name }] of this.objects.entries()) if (name == objectName) return h;
            return 0;
        } else {
            console.log(`findObjectHandleByName(#${groupHandle}, ${objectName})`);
            const group = this.objects.get(groupHandle);
            if (!(group instanceof GroupInstance)) return 0;
            const obj = group.items.find(c => c.name === objectName);
            if (!obj) return 0;
            const objData = this.getObjectData(obj);
            return objData ? objData.handle : 0;
        }
    }

    getObjectHandleFromPoint(x: number, y: number): number {
        throw new Error("Method not implemented.");
    }

    originX: number = 0;
    originY: number = 0;
    setOrigin(x: number, y: number): VmBool {
        this.originX = x;
        this.originY = y;
        for (const obj of this.objects.values()) obj instanceof Element2dInstance && obj.updateVisualPosition();
        return 1;
    }
    render() {
        if (!this.shouldRedraw) return;
        this.canvas.renderAll();
        this.shouldRedraw = false;
    }
}
