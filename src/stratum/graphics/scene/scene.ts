import { VectorDrawing, VectorDrawingElement } from "stratum/fileFormats/vdr";
import { HandleMap } from "stratum/helpers/handleMap";
import { Point2D } from "stratum/helpers/types";
import { EventCode } from "stratum/vm/consts";
import { ExecutionContext } from "stratum/vm/executionContext";
import { ComputableClass } from "stratum/vm/interfaces/computableClass";
import { GraphicSpace } from "stratum/vm/interfaces/graphicSpace";
import { NumBool } from "stratum/vm/types";
import { createObjects, createTools } from "./createToolsAndObjects";
import { InputEventReceiver, Renderer } from "./interfaces";
import { SceneBitmapObject, SceneGroupObject, SceneLineObject, SceneObject, SceneTextObject } from "./objects";
import { SceneTools } from "./sceneTools";

export interface SceneEventSubscriber {
    receiver: ComputableClass;
    ctx: ExecutionContext;
    eventCode: EventCode;
    objectHandle?: number;
}

export interface SceneArgs {
    renderer: Renderer & InputEventReceiver;
    handle: number;
    vdr?: VectorDrawing;
}

export class Scene implements GraphicSpace {
    tools: SceneTools;

    private objects: HandleMap<SceneObject>;
    private _originX: number = 0;
    private _originY: number = 0;
    private subs = new Array<SceneEventSubscriber>();
    private layers: number = 0;

    readonly handle: number;
    readonly renderer: Renderer;

    constructor({ handle, vdr, renderer }: SceneArgs) {
        this.handle = handle;
        this.renderer = renderer;

        if (vdr) {
            const { origin, layers, brushHandle, elements, elementOrder } = vdr;

            this.setOrigin(origin.x, origin.y);
            this.layers = layers;
            this.tools = createTools(vdr);

            if (brushHandle) {
                const brush = this.tools.brushes.get(brushHandle);
                if (brush) {
                    brush.subscribe(this, () => this.renderer.updateBrush(brush));
                    renderer.updateBrush(brush);
                }
            }

            this.objects = elements ? createObjects(elements, renderer, this.tools, layers) : HandleMap.create();
            if (elementOrder) renderer.placeObjects(elementOrder);
        } else {
            this.tools = new SceneTools();
            this.objects = HandleMap.create();
        }

        renderer.subscribeToControlEvents((...args) => this.dispatchControlEvent(...args));
        renderer.subscribeToMouseEvents((...args) => this.dispatchMouseEvent(...args));
    }

    insertVectorDrawing(vdr: VectorDrawing, x: number, y: number) {
        const tools = createTools(vdr);
        const topLevelItems: SceneObject[] = [];

        const map = new Map<number, number>();
        if (vdr.elements) {
            let lastHandle = 0;
            const mappedElements: VectorDrawingElement[] = vdr.elements.map((el) => {
                const newHandle = (lastHandle = HandleMap.getFreeHandle(this.objects, lastHandle));
                map.set(el.handle, newHandle);
                return { ...el, handle: newHandle };
            });
            mappedElements.forEach((el) => {
                if (el.type === "otGROUP2D") el.childHandles = el.childHandles.map((h) => map.get(h)!);
            });
            for (const obj of createObjects(mappedElements, this.renderer, tools, vdr.layers).values()) {
                this.objects.set(obj.handle, obj);
                if (!obj.parent) topLevelItems.push(obj);
            }
        }
        this.tools.merge(tools);
        if (topLevelItems.length === 0) return undefined;

        let root: SceneObject;
        if (topLevelItems.length > 1) {
            const handle = HandleMap.getFreeHandle(this.objects);
            root = new SceneGroupObject({ handle, items: topLevelItems });
            this.objects.set(handle, root);
        } else {
            root = topLevelItems[0];
        }

        root.setPosition(x, y);
        if (vdr.elementOrder) this.renderer.placeObjects(vdr.elementOrder.map((h) => map.get(h)!));
        return root;
    }

    get originX() {
        return this._originX;
    }

    get originY() {
        return this._originY;
    }

    setOrigin(x: number, y: number): NumBool {
        if (x === this._originX && y === this.originY) return 1;
        this._originX = x;
        this._originY = y;
        this.renderer.setView(x, y);
        return 1;
    }

    setLayers(layers: number) {
        if (this.layers !== layers) for (const obj of this.objects.values()) if (obj.type !== "otGROUP2D") obj.setHiddenLayers(layers);
    }

    createLine(points: Point2D[], penHandle: number, brushHandle: number): SceneLineObject {
        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = SceneLineObject.create(
            {
                handle,
                brushHandle,
                penHandle,
                points,
            },
            this.renderer,
            this.tools
        );
        this.objects.set(handle, obj);
        this.renderer.appendObjectToEnd(obj.renderable);
        return obj;
    }

    createBitmap(x: number, y: number, bmpHandle: number, isDouble: boolean): SceneBitmapObject | undefined {
        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = SceneBitmapObject.create(
            {
                handle,
                bmpHandle,
                position: { x, y },
                type: isDouble ? "otDOUBLEBITMAP2D" : "otBITMAP2D",
            },
            this.renderer,
            this.tools
        );
        if (!obj) return undefined;
        this.objects.set(handle, obj);
        this.renderer.appendObjectToEnd(obj.renderable);
        return obj;
    }

    createText(x: number, y: number, angle: number, textToolHandle: number): SceneTextObject | undefined {
        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = SceneTextObject.create(
            {
                handle,
                angle,
                position: { x, y },
                textToolHandle,
            },
            this.renderer,
            this.tools
        );
        if (!obj) return undefined;
        this.objects.set(handle, obj);
        this.renderer.appendObjectToEnd(obj.renderable);
        return obj;
    }

    createGroup(objectHandles: number[]): SceneGroupObject | undefined {
        const items = new Array<SceneObject>(objectHandles.length);
        for (let i = 0; i < objectHandles.length; i++) {
            const handle = objectHandles[i];
            const obj = this.objects.get(handle);
            if (!obj) console.warn(`Попытка создать группу с несуществующим объектом ${handle}`);
            else items[i] = obj;
        }

        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = new SceneGroupObject({ handle, items });
        this.objects.set(handle, obj);
        return obj;
    }

    getObject(handle: number): SceneObject | undefined {
        return this.objects.get(handle);
    }

    deleteObject(handle: number): NumBool {
        const obj = this.objects.get(handle);
        if (!obj) return 0;

        if (obj.parent) obj.parent.removeItem(obj);
        if (obj.type !== "otGROUP2D") {
            if (obj.type !== "otCONTROL2D") obj.unsubFromTools();
            this.renderer.removeObject(obj.renderable);
        } else {
            const items = obj.items;
            obj.removeAllItems();
            for (const item of items) this.deleteObject(item.handle);
        }
        this.objects.delete(handle);
        return 1;
    }

    deleteGroup(groupHandle: number): NumBool {
        const group = this.objects.get(groupHandle);
        if (!group || group.type !== "otGROUP2D") return 0;
        group.removeAllItems();
        this.objects.delete(groupHandle);
        return 1;
    }

    moveObjectToTop(handle: number): NumBool {
        const obj = this.objects.get(handle);
        if (!obj) return 0;
        if (obj.type === "otGROUP2D") {
            this.renderer.moveObjectRangeToTop(obj.getItemsRecursive().map((t) => t.renderable));
        } else {
            this.renderer.moveObjectToTop(obj.renderable);
        }
        return 1;
    }

    private findObjectInGroup(objectName: string, group: SceneGroupObject): SceneObject | undefined {
        for (const item of group.items) {
            if (item.name === objectName) return item;
            if (item.type === "otGROUP2D") {
                return this.findObjectInGroup(objectName, item);
            }
        }
        return undefined;
    }

    findObjectByName(objectName: string, groupHandle: number): SceneObject | undefined {
        if (groupHandle === 0) {
            for (const obj of this.objects.values()) if (obj.name === objectName) return obj;
            return undefined;
        }

        const group = this.objects.get(groupHandle);
        return group !== undefined && group.type === "otGROUP2D" ? this.findObjectInGroup(objectName, group) : undefined;
    }

    getObjectFromPoint(x: number, y: number) {
        const handle = this.renderer.getVisualHandleFromPoint(x, y);
        if (!handle) return undefined;
        let obj = this.objects.get(handle);
        if (!obj) return undefined;
        while (obj.parent) {
            obj = obj.parent;
        }
        return obj;
    }

    isIntersect(obj1Handle: number, obj2Handle: number): NumBool {
        const obj1 = this.objects.get(obj1Handle);
        if (!obj1) return 0;
        const obj2 = this.objects.get(obj2Handle);
        if (!obj2) return 0;
        // if(obj1.positionX === obj2.positionX && obj1.positionY === obj2.positionY) return 1;
        const xmin1 = obj1.positionX;
        const xmax1 = xmin1 + obj1.width;
        const ymin1 = obj1.positionY;
        const ymax1 = ymin1 + obj1.height;
        const xmin2 = obj2.positionX;
        const xmax2 = xmin2 + obj2.width;
        const ymin2 = obj2.positionY;
        const ymax2 = ymin2 + obj2.height;
        return xmax1 >= xmin2 && xmax2 >= xmin1 && ymax1 >= ymin2 && ymax2 >= ymin1 ? 1 : 0;
    }

    subscribeToEvent(eventCode: EventCode, objectHandle: number, flags: number, ctx: ExecutionContext): void {
        const receiver = ctx.currentClass;
        if (this.subs.some((s) => s.receiver === receiver && s.eventCode === eventCode)) {
            console.warn(`Повторный RegisterObject(${receiver.protoName}, ${EventCode[eventCode]}, #${objectHandle})`);
            return;
        }
        this.subs.push({ ctx, receiver, objectHandle, eventCode });
    }

    private static setDoubleValue(sub: SceneEventSubscriber, name: string, value: number) {
        const varId = sub.receiver.vars!.nameToIdMap.get(name);
        if (varId !== undefined) {
            const realId = sub.receiver.vars!.globalIds[varId];
            sub.ctx.memoryManager.newDoubleValues[realId] = value;
            sub.ctx.memoryManager.oldDoubleValues[realId] = value;
        }
    }
    private static setLongValue(sub: SceneEventSubscriber, name: string, value: number) {
        const varId = sub.receiver.vars!.nameToIdMap.get(name);
        if (varId !== undefined) {
            const realId = sub.receiver.vars!.globalIds[varId];
            sub.ctx.memoryManager.newLongValues[realId] = value;
            sub.ctx.memoryManager.oldLongValues[realId] = value;
        }
    }

    private dispatchControlEvent(code: EventCode, controlHandle: number) {
        this.subs.forEach((sub) => {
            const shouldReceiveEvent =
                //prettier-ignore
                sub.eventCode === code && //совпадает ли код сообщения
                ((sub.objectHandle ? controlHandle === sub.objectHandle : true) || sub.receiver.isCapturingEvents(this.handle));

            if (!shouldReceiveEvent || !sub.receiver.canReceiveEvents) return;
            Scene.setDoubleValue(sub, "msg", code);
            Scene.setLongValue(sub, "_hobject", controlHandle);
            Scene.setDoubleValue(sub, "iditem", -1);
            Scene.setDoubleValue(sub, "wnotifycode", 768); //EN_CHANGE = 768
            sub.receiver.compute(sub.ctx, true);
        });
    }

    private dispatchMouseEvent(code: EventCode, buttons: number, x: number, y: number) {
        this.subs.forEach((sub) => {
            if (!sub.receiver.canReceiveEvents) return;
            const msgMatch = sub.eventCode === code || sub.eventCode === EventCode.WM_ALLMOUSEMESSAGE;
            if (!msgMatch) return;
            if (!sub.receiver.isCapturingEvents(this.handle) && sub.objectHandle) {
                const obj = this.getObjectFromPoint(x, y);
                const handleMatch = obj ? obj.handle === sub.objectHandle : false;
                if (!handleMatch && !this.renderer.testVisualIntersection(sub.objectHandle, x, y)) return;
            }
            Scene.setDoubleValue(sub, "msg", code);
            Scene.setDoubleValue(sub, "xpos", x);
            Scene.setDoubleValue(sub, "ypos", y);
            Scene.setDoubleValue(sub, "fwkeys", buttons);
            sub.receiver.compute(sub.ctx, true);
        });
    }
}
