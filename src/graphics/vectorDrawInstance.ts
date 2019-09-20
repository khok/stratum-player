import { fabric } from "fabric";
import { GraphicObjectFunctions, GraphicSpaceFunctions, VmBool } from "../vm/types";
import { Element2dInstance, ElementInstance, GroupInstance } from "./graphicObject";
import { Element2d, HandleMap, VectorDrawData } from "./types";

function instantiateObject(
    element: Element2d,
    { bitmaps, brushes, pens, doubleBitmaps, fonts, strings, texts }: VectorDrawData
): fabric.Object {
    switch (element.type) {
        case "line":
            const opts: fabric.IObjectOptions = {};
            const { brushHandle, penHandle, points } = element;
            if (brushHandle) opts.fill = brushes!.get(brushHandle)!.color;
            if (penHandle) {
                const pen = pens!.get(penHandle)!;
                opts.strokeWidth = pen.width || 0.5; //минимально возможная толщина (придумал сам)
                opts.stroke = pen.color;
            }
            /*
             * По идее, здесь должен быть lazy-slice -
             * т.е. копирование происходит только при попытке
             * изменения контура полилинии.
             */
            return new fabric.Polyline(points, opts);
        case "text":
            throw new Error("Text Not implemented.");
        case "doubleBitmap": {
            const { size, sourceHandle } = element.data;
            return new fabric.Rect({ fill: "gray", width: size.x, height: size.y });
        }
        case "bitmap": {
            const { size } = element.data;
            return new fabric.Rect({ fill: "gray", width: size.x, height: size.y });
        }
        case "control":
            throw new Error("Control Not implemented.");
    }
}

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
            for (const [handle, value] of image.elements) {
                if (value.type == "group") continue;
                const visual = instantiateObject(value, image);
                this.visuals.set(handle, visual);
                const obj = new Element2dInstance(this, visual, value);
                this.objects.set(handle, obj);
                this.objectDataMap.set(obj, { handle });
            }
            for (const [handle, value] of image.elements) {
                if (value.type != "group") continue;
                const obj = new GroupInstance(value, this.objects);
                this.objects.set(handle, obj);
                this.objectDataMap.set(obj, { handle });
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

    getObject(objectHandle: number): GraphicObjectFunctions | undefined {
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
        this.objects.forEach(ob => ob instanceof Element2dInstance && ob.updateVisualPosition());
        return 1;
    }
    render() {
        if (!this.shouldRedraw) return;
        this.canvas.renderAll();
        this.shouldRedraw = false;
    }
}
