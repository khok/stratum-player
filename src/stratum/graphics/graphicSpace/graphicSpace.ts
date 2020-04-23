import { Scene } from "scene-types";
import { Point2D, VectorDrawData } from "vdr-types";
import { ClassState, VmBool } from "vm-interfaces-core";
import { GraphicSpaceState } from "vm-interfaces-gspace";
import { VmStateContainer } from "vm-types";
import { HandleMap } from "~/helpers/handleMap";
import { MessageCode } from "~/helpers/vmConstants";
import { BitmapToolFactory } from "./bitmapToolFactory";
import { createObjects, createTools } from "./createToolsAndObjects";
import { GraphicSpaceTools } from "./graphicSpaceTools";
import { BitmapObject, GraphicObject, GroupObject, LineObject, TextObject } from "./objects";
import { BrushTool } from "./tools";

export interface GraphicSpaceSubsciber {
    msg: MessageCode;
    objectHandle?: number;
    klass: ClassState;
    ctx: VmStateContainer;
}

export interface GraphicSpaceOptions {
    scene: Scene;
    bmpFactory: BitmapToolFactory;
    sourceName?: string;
    vdr?: VectorDrawData;
}

/**
 * Графическое пространство, содержащее инструменты и объекты.
 */
export class GraphicSpace implements GraphicSpaceState {
    handle = 0;
    readonly scene: Scene;
    readonly tools: GraphicSpaceTools;
    private objects: HandleMap<GraphicObject>;
    private _originX: number = 0;
    private _originY: number = 0;
    private subs = new Array<GraphicSpaceSubsciber>();
    private layers = 0;

    readonly sourceName: string;

    constructor(data: GraphicSpaceOptions) {
        const { vdr, bmpFactory, scene } = data;
        this.sourceName = data.sourceName || "";
        this.scene = scene;
        this.scene.subscribeToControlEvents((...args) => this.dispatchControlEvent(...args));
        this.scene.subscribeToMouseEvents((...args) => this.dispatchMouseEvent(...args));

        this.tools = vdr ? createTools(vdr, bmpFactory) : new GraphicSpaceTools({ bmpFactory });
        this.objects =
            vdr && vdr.elements
                ? createObjects(vdr.elements, this.tools, scene, vdr.layers)
                : HandleMap.create<GraphicObject>();

        if (!vdr) return;
        const { brushHandle, origin, elementOrder } = vdr;

        if (origin) this.setOrigin(origin.x, origin.y);
        if (brushHandle) {
            const brush = this.tools.getTool("ttBRUSH2D", brushHandle) as BrushTool;
            if (brush) {
                brush.subscribe(this, () => this.scene.updateBrush(brush));
                this.scene.updateBrush(brush);
            }
        }

        if (elementOrder) this.scene.placeObjects(elementOrder);
        this.layers = vdr.layers;
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
            for (const obj of this.objects.values()) if (obj.type !== "otGROUP2D") obj.hiddenLayers = layers;
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
            this.tools,
            this.scene
        );
        this.objects.set(handle, obj);
        this.scene.appendObjectToEnd(obj.visual);
        obj.handle = handle;
        return obj;
    }

    createBitmap(x: number, y: number, dibHandle: number, isDouble: boolean): BitmapObject {
        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = new BitmapObject(
            {
                handle,
                dibHandle,
                doubleDibHandle: dibHandle,
                position: { x, y },
                type: isDouble ? "otDOUBLEBITMAP2D" : "otBITMAP2D",
            },
            this.tools,
            this.scene
        );
        this.objects.set(handle, obj);
        this.scene.appendObjectToEnd(obj.visual);
        obj.handle = handle;
        return obj;
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
            this.tools,
            this.scene
        );
        this.objects.set(handle, obj);
        this.scene.appendObjectToEnd(obj.visual);
        obj.handle = handle;
        return obj;
    }

    createGroup(objectHandles: number[]): GroupObject | undefined {
        const items = new Array<GraphicObject>(objectHandles.length);
        for (let i = 0; i < objectHandles.length; i++) {
            const handle = objectHandles[i];
            const obj = this.getObject(handle);
            if (!obj) console.warn(`Попытка создать группу с несуществующим объектом ${handle}`);
            else items[i] = obj;
        }

        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = new GroupObject({ handle, items });
        this.objects.set(handle, obj);
        obj.handle = handle;
        return obj;
    }

    moveObjectToTop(handle: number): VmBool {
        const obj = this.getObject(handle);
        if (!obj) return 0;
        if (obj.type === "otGROUP2D") {
            for (const item of obj.items) this.moveObjectToTop(item.handle);
        } else {
            this.scene.moveObjectToTop(obj.visual);
        }
        return 1;
    }

    getObject(handle: number): GraphicObject | undefined {
        // if (handle === 0) return undefined; //unlikely
        return this.objects.get(handle);
    }

    deleteObject(handle: number): VmBool {
        const obj = this.objects.get(handle);
        if (!obj) return 0;
        if (obj.type !== "otGROUP2D") {
            obj.destroy();
            this.scene.removeObject(obj.visual);
        } else {
            const items = obj.items;
            obj.destroy();
            for (const item of items) this.deleteObject(item.handle);
        }
        this.objects.delete(handle);
        return 1;
    }

    deleteGroup(group: GroupObject): VmBool {
        group.destroy();
        this.objects.delete(group.handle);
        return 1;
    }

    subscribe(ctx: VmStateContainer, klass: ClassState, msg: MessageCode, objectHandle: number, flags: number): void {
        if (this.subs.some((s) => s.klass === klass && s.msg === msg)) {
            console.warn(`Попытка повторной подписки на сообщение ${MessageCode[msg]} классом ${klass.protoName}`);
            return;
        }
        this.subs.push({ ctx, klass, objectHandle, msg });
    }

    private static setKlassDoubleValueByLowCaseName(sub: GraphicSpaceSubsciber, name: string, value: number) {
        const _id = sub.klass.varnameToIdMap!.get(name)!;
        if (_id > -1) {
            const id = sub.klass.doubleIdToGlobal![_id];
            sub.ctx.memoryState.newDoubleValues[id] = value;
            sub.ctx.memoryState.oldDoubleValues[id] = value;
        }
    }
    private static setKlassLongValueByLowCaseName(sub: GraphicSpaceSubsciber, name: string, value: number) {
        const _id = sub.klass.varnameToIdMap!.get(name)!;
        if (_id > -1) {
            const id = sub.klass.longIdToGlobal![_id];
            sub.ctx.memoryState.newLongValues[id] = value;
            sub.ctx.memoryState.oldLongValues[id] = value;
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
        let obj = this.getObject(handle);
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
}
