import { VectorDrawing, VectorDrawingElement } from "stratum/fileFormats/vdr";
import { HandleMap } from "stratum/helpers/handleMap";
import { Point2D } from "stratum/helpers/types";
import { NumBool } from "stratum/translator";
import { createObjects, createTools } from "./createToolsAndObjects";
import { Renderer } from "./interfaces";
import { SceneBitmapObject, SceneGroupObject, SceneLineObject, SceneObject, SceneTextObject } from "./objects";
import { SceneTools } from "./sceneTools";

export interface SceneArgs {
    renderer: Renderer;
    vdr?: VectorDrawing;
}

export class Scene {
    setScale(ms: number): NumBool {
        return 1;
    }
    tools: SceneTools;

    readonly objects: HandleMap<SceneObject>;
    private _originX: number = 0;
    private _originY: number = 0;
    private layers: number = 0;

    readonly renderer: Renderer;
    scale: number = 1;

    constructor({ vdr, renderer }: SceneArgs) {
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

        // renderer.subscribeToControlEvents((...args) => this.dispatchControlEvent(...args));
        // renderer.subscribeToMouseEvents((...args) => this.dispatchMouseEvent(...args));
        // renderer.subscribeToWindowResize((...args) => this.dispatchWindowResizeEvent(...args));
    }

    insertVectorDrawing(x: number, y: number, flags: number, vdr: VectorDrawing): number {
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
        if (topLevelItems.length === 0) return 0;

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
        return root.handle;
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

    createLine(hpen: number, hbrush: number, coords: number[]): number {
        const handle = HandleMap.getFreeHandle(this.objects);

        const points = Array.from({ length: coords.length / 2 }, (_, i) => ({ x: coords[i * 2], y: coords[i * 2 + 1] }));
        const obj = SceneLineObject.create(
            {
                handle,
                brushHandle: hbrush,
                penHandle: hpen,
                points,
            },
            this.renderer,
            this.tools
        );
        this.objects.set(handle, obj);
        this.renderer.appendObjectToEnd(obj.renderable);
        return handle;
    }

    createBitmap(x: number, y: number, bmpHandle: number, isDouble: boolean): number {
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
        if (obj === undefined) return 0;
        this.objects.set(handle, obj);
        this.renderer.appendObjectToEnd(obj.renderable);
        return handle;
    }

    createText(htext: number, x: number, y: number, angle: number): number {
        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = SceneTextObject.create(
            {
                handle,
                angle,
                position: { x, y },
                textToolHandle: htext,
            },
            this.renderer,
            this.tools
        );
        if (obj === undefined) return 0;
        this.objects.set(handle, obj);
        this.renderer.appendObjectToEnd(obj.renderable);
        return handle;
    }

    createGroup(objectHandles: number[]): number {
        const items = new Array<SceneObject>(objectHandles.length);
        for (let i = 0; i < objectHandles.length; i++) {
            const handle = objectHandles[i];
            const obj = this.objects.get(handle);
            // if (obj === undefined) console.warn(`Попытка создать группу с несуществующим объектом ${handle}`);
            // else items[i] = obj;
            if (obj !== undefined) items[i] = obj;
        }

        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = new SceneGroupObject({ handle, items });
        this.objects.set(handle, obj);
        return handle;
    }

    getObject(handle: number): SceneObject | undefined {
        return this.objects.get(handle);
    }

    getObject2dByName(hgroup: number, name: string): number {
        const obj = this.findObjectByName(name, hgroup);
        return obj !== undefined ? obj.handle : 0;
    }

    getObjectParent2d(hobject: number): number {
        const obj = this.objects.get(hobject);
        return obj !== undefined && obj.parent !== undefined ? obj.parent.handle : 0;
    }

    getGroupItem2d(hgroup: number, index: number): number {
        const obj = this.objects.get(hgroup);
        return obj !== undefined && obj.type === "otGROUP2D" ? obj.getItemHandle(index) : 0;
    }

    delGroupItem2d(hgroup: number, hobject: number): NumBool {
        const obj = this.objects.get(hobject);
        return obj !== undefined && obj.parent !== undefined ? obj.parent.removeItem(obj) : 0;
    }

    getObjectFromPoint2d(x: number, y: number): number {
        const obj = this.getObjectFromPoint(x, y);
        return obj !== undefined ? obj.handle : 0;
    }

    deleteObject(handle: number): NumBool {
        const obj = this.objects.get(handle);
        if (obj === undefined) return 0;

        if (obj.parent !== undefined) obj.parent.removeItem(obj);
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

    deleteGroup2d(groupHandle: number): NumBool {
        const group = this.objects.get(groupHandle);
        if (group === undefined || group.type !== "otGROUP2D") return 0;
        group.removeAllItems();
        this.objects.delete(groupHandle);
        return 1;
    }

    moveObjectToTop(handle: number): NumBool {
        const obj = this.objects.get(handle);
        if (obj === undefined) return 0;
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
        const handle = this.renderer.handleAtPoint(x, y);
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
        if (obj1 === undefined) return 0;
        const obj2 = this.objects.get(obj2Handle);
        if (obj2 === undefined) return 0;
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
}
