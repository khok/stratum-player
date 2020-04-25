import { Scene } from "scene-types";
import { ElementData, Point2D, VectorDrawData } from "vdr-types";
import { ClassState, VmBool } from "vm-interfaces-core";
import { GraphicSpaceState } from "vm-interfaces-gspace";
import { VmStateContainer } from "vm-types";
import { StratumError } from "~/helpers/errors";
import { HandleMap } from "~/helpers/handleMap";
import { MessageCode } from "~/helpers/vmConstants";
import { BitmapToolFactory } from "./bitmapToolFactory";
import { createObjects, createTools } from "./createToolsAndObjects";
import { GraphicSpaceTools } from "./graphicSpaceTools";
import { BitmapObject, GraphicObject, GroupObject, LineObject, TextObject } from "./objects";

export interface GraphicSpaceSubsciber {
    msg: MessageCode;
    objectHandle?: number;
    klass: ClassState;
    ctx: VmStateContainer;
}

export interface GraphicSpaceOptions {
    handle: number;
    vdr?: VectorDrawData;
    bmpFactory: BitmapToolFactory;
    scene: Scene;
}

/**
 * Графическое пространство, содержащее инструменты и объекты.
 */
export class GraphicSpace implements GraphicSpaceState {
    private objects: HandleMap<GraphicObject>;
    private _originX: number = 0;
    private _originY: number = 0;
    private subs = new Array<GraphicSpaceSubsciber>();
    private layers: number = 0;

    readonly handle: number;
    readonly tools: GraphicSpaceTools;
    readonly scene: Scene;

    constructor({ handle, vdr, bmpFactory, scene }: GraphicSpaceOptions) {
        this.handle = handle;
        this.scene = scene;

        if (vdr) {
            const { origin, layers, brushHandle, elements, elementOrder } = vdr;

            this.setOrigin(origin.x, origin.y);
            this.layers = layers;
            this.tools = createTools(vdr, bmpFactory);

            if (brushHandle) {
                const brush = this.tools.brushes.get(brushHandle);
                if (!brush) throw new StratumError(`Инструмент Кисть #${brushHandle} не существует`);
                brush.subscribe(this, () => this.scene.updateBrush(brush));
                scene.updateBrush(brush);
            }

            this.objects = elements ? createObjects(elements, scene, this.tools, layers) : HandleMap.create();
            if (elementOrder) scene.placeObjects(elementOrder);
        } else {
            this.tools = new GraphicSpaceTools({ bmpFactory });
            this.objects = HandleMap.create();
        }

        scene.subscribeToControlEvents((...args) => this.dispatchControlEvent(...args));
        scene.subscribeToMouseEvents((...args) => this.dispatchMouseEvent(...args));
    }

    mergeVdr(vdr: VectorDrawData, x: number, y: number) {
        const tools = createTools(vdr, this.tools.bmpFactory);
        const topLevelItems: GraphicObject[] = [];

        const map = new Map<number, number>();
        if (vdr.elements) {
            let lastHandle = 0;
            const mappedElements: ElementData[] = vdr.elements.map((el) => {
                const newHandle = (lastHandle = HandleMap.getFreeHandle(this.objects, lastHandle));
                map.set(el.handle, newHandle);
                return { ...el, handle: newHandle };
            });
            mappedElements.forEach((el) => {
                if (el.type === "otGROUP2D") el.childHandles = el.childHandles.map((h) => map.get(h)!);
            });
            for (const obj of createObjects(mappedElements, this.scene, tools, vdr.layers).values()) {
                this.objects.set(obj.handle, obj);
                if (!obj.parent) topLevelItems.push(obj);
            }
        }
        this.tools.merge(tools);
        if (topLevelItems.length === 0) throw new StratumError("VDR файл не содержит элементов");

        let root: GraphicObject;
        if (topLevelItems.length > 1) {
            const handle = HandleMap.getFreeHandle(this.objects);
            root = new GroupObject({ handle, items: topLevelItems });
            this.objects.set(handle, root);
        } else {
            root = topLevelItems[0];
        }

        root.setPosition(x, y);
        if (vdr.elementOrder) this.scene.placeObjects(vdr.elementOrder.map((h) => map.get(h)!));
        return root.handle;
    }

    get originX() {
        return this._originX;
    }

    get originY() {
        return this._originY;
    }

    setOrigin(x: number, y: number): VmBool {
        if (x === this._originX && y === this.originY) return 1;
        this._originX = x;
        this._originY = y;
        this.scene.translateView(x, y);
        return 1;
    }

    setLayers(layers: number) {
        if (this.layers !== layers)
            for (const obj of this.objects.values()) if (obj.type !== "otGROUP2D") obj.setHiddenLayers(layers);
    }

    createLine(points: Point2D[], penHandle: number, brushHandle: number): LineObject {
        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = new LineObject(
            {
                handle,
                brushHandle,
                penHandle,
                points,
                position: points[0],
            },
            this.scene,
            this.tools
        );
        this.objects.set(handle, obj);
        this.scene.appendObjectToEnd(obj.visual);
        return obj;
    }

    createBitmap(x: number, y: number, bmpHandle: number, isDouble: boolean): BitmapObject {
        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = new BitmapObject(
            {
                handle,
                bmpHandle,
                position: { x, y },
                type: isDouble ? "otDOUBLEBITMAP2D" : "otBITMAP2D",
            },
            this.scene,
            this.tools
        );
        this.objects.set(handle, obj);
        this.scene.appendObjectToEnd(obj.visual);
        return obj;
    }

    createText(x: number, y: number, angle: number, textToolHandle: number): TextObject {
        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = new TextObject(
            {
                handle,
                angle,
                position: { x, y },
                textToolHandle,
            },
            this.scene,
            this.tools
        );
        this.objects.set(handle, obj);
        this.scene.appendObjectToEnd(obj.visual);
        return obj;
    }

    createGroup(objectHandles: number[]): GroupObject | undefined {
        const items = new Array<GraphicObject>(objectHandles.length);
        for (let i = 0; i < objectHandles.length; i++) {
            const handle = objectHandles[i];
            const obj = this.objects.get(handle);
            if (!obj) console.warn(`Попытка создать группу с несуществующим объектом ${handle}`);
            else items[i] = obj;
        }

        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = new GroupObject({ handle, items });
        this.objects.set(handle, obj);
        return obj;
    }

    getObject(handle: number): GraphicObject | undefined {
        return this.objects.get(handle);
    }

    deleteObject(handle: number): VmBool {
        const obj = this.objects.get(handle);
        if (!obj) return 0;

        if (obj.parent) obj.parent.removeItem(obj);
        if (obj.type !== "otGROUP2D") {
            if (obj.type !== "otCONTROL2D") obj.unsubFromTools();
            this.scene.removeObject(obj.visual);
        } else {
            const items = obj.items;
            obj.removeAllItems();
            for (const item of items) this.deleteObject(item.handle);
        }
        this.objects.delete(handle);
        return 1;
    }

    deleteGroup(groupHandle: number): VmBool {
        const group = this.objects.get(groupHandle);
        if (!group || group.type !== "otGROUP2D") return 0;
        group.removeAllItems();
        this.objects.delete(groupHandle);
        return 1;
    }

    moveObjectToTop(handle: number): VmBool {
        const obj = this.objects.get(handle);
        if (!obj) return 0;
        if (obj.type === "otGROUP2D") {
            this.scene.moveObjectRangeToTop(obj.getItemsRecursive().map((t) => t.visual));
        } else {
            this.scene.moveObjectToTop(obj.visual);
        }
        return 1;
    }

    findObjectByName(objectName: string, group?: GroupObject): GraphicObject | undefined {
        if (!group) {
            for (const obj of this.objects.values()) if (obj.name === objectName) return obj;
            return undefined;
        }

        for (const item of group.items) {
            if (item.name === objectName) return item;
            if (item.type === "otGROUP2D") {
                const result = this.findObjectByName(objectName, item);
                if (result) return result;
            }
        }
        return undefined;
    }

    getObjectFromPoint(x: number, y: number) {
        const handle = this.scene.getVisualHandleFromPoint(x, y);
        if (!handle) return undefined;
        let obj = this.objects.get(handle);
        if (!obj) return undefined;
        while (obj.parent) {
            obj = obj.parent;
        }
        return obj;
    }

    isIntersect(obj1: GraphicObject, obj2: GraphicObject): VmBool {
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

    subscribe(ctx: VmStateContainer, klass: ClassState, msg: MessageCode, objectHandle: number, flags: number): void {
        if (this.subs.some((s) => s.klass === klass && s.msg === msg && objectHandle === objectHandle)) {
            console.warn(`Повторный RegisterObject(${klass.protoName}, ${MessageCode[msg]}, #${objectHandle})`);
            return;
        }
        this.subs.push({ ctx, klass, objectHandle, msg });
    }

    private static setKlassDoubleValueByLowCaseName(sub: GraphicSpaceSubsciber, name: string, value: number) {
        const varId = sub.klass.varnameToIdMap!.get(name);
        if (varId !== undefined) {
            const realId = sub.klass.doubleIdToGlobal![varId];
            sub.ctx.memoryState.newDoubleValues[realId] = value;
            sub.ctx.memoryState.oldDoubleValues[realId] = value;
        }
    }
    private static setKlassLongValueByLowCaseName(sub: GraphicSpaceSubsciber, name: string, value: number) {
        const varId = sub.klass.varnameToIdMap!.get(name);
        if (varId !== undefined) {
            const realId = sub.klass.longIdToGlobal![varId];
            sub.ctx.memoryState.newLongValues[realId] = value;
            sub.ctx.memoryState.oldLongValues[realId] = value;
        }
    }

    private dispatchControlEvent(code: MessageCode, controlHandle: number) {
        this.subs.forEach((sub) => {
            const shouldReceiveEvent =
                //prettier-ignore
                sub.msg === code && //совпадает ли код сообщения
                ((sub.objectHandle ? controlHandle === sub.objectHandle : true) || sub.klass.isCapturingEvents(this.handle));

            if (!shouldReceiveEvent || !sub.klass.canReceiveEvents) return;
            GraphicSpace.setKlassDoubleValueByLowCaseName(sub, "msg", code);
            GraphicSpace.setKlassLongValueByLowCaseName(sub, "_hobject", controlHandle);
            GraphicSpace.setKlassDoubleValueByLowCaseName(sub, "iditem", -1);
            GraphicSpace.setKlassDoubleValueByLowCaseName(sub, "wnotifycode", 768); //EN_CHANGE = 768
            sub.klass.computeSchemeRecursive(sub.ctx, true);
        });
    }

    private dispatchMouseEvent(code: MessageCode, buttons: number, x: number, y: number) {
        this.subs.forEach((sub) => {
            if (!sub.klass.canReceiveEvents) return;
            const msgMatch = sub.msg === code || sub.msg === MessageCode.WM_ALLMOUSEMESSAGE;
            if (!msgMatch) return;
            if (!sub.klass.isCapturingEvents(this.handle) && sub.objectHandle) {
                const obj = this.getObjectFromPoint(x, y);
                const handleMatch = obj ? obj.handle === sub.objectHandle : false;
                if (!handleMatch && !this.scene.testVisualIntersection(sub.objectHandle, x, y)) return;
            }
            GraphicSpace.setKlassDoubleValueByLowCaseName(sub, "msg", code);
            GraphicSpace.setKlassDoubleValueByLowCaseName(sub, "xpos", x);
            GraphicSpace.setKlassDoubleValueByLowCaseName(sub, "ypos", y);
            GraphicSpace.setKlassDoubleValueByLowCaseName(sub, "fwkeys", buttons);
            sub.klass.computeSchemeRecursive(sub.ctx, true);
        });
    }
}
