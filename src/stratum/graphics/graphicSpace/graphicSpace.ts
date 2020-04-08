import { Point2D, VectorDrawData } from "data-types-graphics";
import { ImageResolver } from "internal-graphic-types";
import { Scene } from "scene-types";
import { ClassState, VmBool } from "vm-interfaces-base";
import { GraphicSpaceState } from "vm-interfaces-graphics";
import { VmStateContainer } from "vm-types";
import { HandleMap } from "~/helpers/handleMap";
import { MessageCode } from "~/helpers/vmConstants";
import { createObjects, createTools } from "./createToolsAndObjects";
import { GraphicSpaceTools } from "./graphicSpaceTools";
import { GraphicObject, GroupObject, TextObject, LineObject, BitmapObject } from "./objects";
import { BrushTool } from "./tools";

export interface GraphicSpaceSubsciber {
    msg: MessageCode;
    objectHandle?: number;
    klass: ClassState;
    ctx: VmStateContainer;
}

/**
 * Графическое пространство, содержащее инструменты и объекты.
 */
export class GraphicSpace implements GraphicSpaceState {
    static fromVdr(sourceFilename: string, vdr: VectorDrawData, imageLoader: ImageResolver, scene: Scene) {
        const tools = createTools(vdr, imageLoader);
        const objects = vdr.elements && createObjects(vdr.elements, tools, scene);
        return new GraphicSpace({ ...vdr, tools, objects, sourceFilename }, scene);
    }

    handle = 0;
    readonly tools: GraphicSpaceTools;
    private allObjects: HandleMap<GraphicObject>;
    private _originX: number = 0;
    private _originY: number = 0;
    private subs = new Array<GraphicSpaceSubsciber>();

    readonly sourceFilename: string;

    constructor(
        data: VectorDrawData & {
            tools?: GraphicSpaceTools;
            objects?: HandleMap<GraphicObject>;
            sourceFilename: string;
        },
        public scene: Scene
    ) {
        this.sourceFilename = data.sourceFilename;
        this.setOrigin(data.origin.x, data.origin.y);
        this.tools = data.tools || new GraphicSpaceTools();
        this.allObjects = data.objects || HandleMap.create<GraphicObject>();
        if (data.brushHandle) {
            const brush = this.tools.getTool<BrushTool>("ttBRUSH2D", data.brushHandle);
            if (brush) {
                brush.subscribe(this, () => this.scene.updateBrush(brush));
                this.scene.updateBrush(brush);
            }
        }
        scene.applyLayers(data.layers);
        if (data.elementOrder) this.scene.placeObjects(data.elementOrder);
        this.scene.subscribeToControlEvents((...args) => this.dispatchControlEvent(...args));
        this.scene.subscribeToMouseEvents((...args) => this.dispatchMouseEvent(...args));
    }

    get originX() {
        return this._originX;
    }

    get originY() {
        return this._originY;
    }

    setOrigin(x: number, y: number): VmBool {
        this._originX = x;
        this._originY = y;
        this.scene.translateView(x, y);
        return 1;
    }

    createText(x: number, y: number, angle: number, textHandle: number): TextObject {
        const handle = HandleMap.getFreeHandle(this.allObjects);
        const obj = new TextObject(
            {
                handle,
                angle,
                position: { x, y },
                delta: 0,
                name: "",
                size: { x: 0, y: 0 },
                options: 0,
                textHandle,
                type: "otTEXT2D",
            },
            this.tools,
            this.scene
        );
        this.allObjects.set(handle, obj);
        this.scene.appendLastObject(handle);
        obj.handle = handle;
        return obj;
    }

    createBitmap(x: number, y: number, bitmapToolHandle: number): BitmapObject {
        const handle = HandleMap.getFreeHandle(this.allObjects);
        const obj = new BitmapObject(
            {
                handle,
                bmpAngle: 0,
                bmpOrigin: { x: 0, y: 0 },
                size: { x: 0, y: 0 },
                dibHandle: bitmapToolHandle,
                name: "",
                options: 0,
                position: { x, y },
                type: "otBITMAP2D",
            },
            this.tools,
            this.scene
        );
        this.allObjects.set(handle, obj);
        this.scene.appendLastObject(handle);
        obj.handle = handle;
        return obj;
    }

    createLine(points: Point2D[], penHandle: number, brushHandle: number): LineObject {
        const handle = HandleMap.getFreeHandle(this.allObjects);
        const obj = new LineObject(
            {
                type: "otLINE2D",
                handle,
                brushHandle,
                penHandle,
                name: "",
                points,
                position: points[0],
                size: { x: 0, y: 0 },
                options: 0,
            },
            this.tools,
            this.scene
        );
        this.allObjects.set(handle, obj);
        this.scene.appendLastObject(handle);
        obj.handle = handle;
        return obj;
    }

    createGroup(objectHandles: number[]): GroupObject | undefined {
        const objects = new Array<GraphicObject>(objectHandles.length);
        for (let i = 0; i < objectHandles.length; i++) {
            const handle = objectHandles[i];
            const obj = this.getObject(handle);
            if (!obj) return undefined;
            objects[i] = obj;
        }

        const handle = HandleMap.getFreeHandle(this.allObjects);
        const obj = new GroupObject({ items: objects.values() });
        this.allObjects.set(handle, obj);
        obj.handle = handle;
        return obj;
    }

    moveObjectToTop(handle: number): VmBool {
        this.scene.moveObjectToTop(handle);
        return 1;
    }

    getObject(handle: number): GraphicObject | undefined {
        // if (handle === 0) return undefined; //unlikely
        return this.allObjects.get(handle);
    }

    deleteObject(handle: number): VmBool {
        const obj = this.allObjects.get(handle);
        if (!obj) return 0;
        obj.destroy();
        if (obj.type !== "otGROUP2D") {
            this.scene.removeObject(obj.visual);
        } else {
            for (const item of obj.items) this.deleteObject(item.handle);
        }
        this.allObjects.delete(handle);
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
        const _id = sub.klass.varIdToLowcaseNameMap!.get(name)!;
        if (_id > -1) {
            const id = sub.klass.doubleVarMappingArray![_id];
            sub.ctx.memoryState.newDoubleValues[id] = value;
            sub.ctx.memoryState.oldDoubleValues[id] = value;
        }
    }
    private static setKlassLongValueByLowCaseName(sub: GraphicSpaceSubsciber, name: string, value: number) {
        const _id = sub.klass.varIdToLowcaseNameMap!.get(name)!;
        if (_id > -1) {
            const id = sub.klass.longVarMappingArray![_id];
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
            // sub.klass.setVarValueByLowCaseName("msg", code);
            // sub.klass.setVarValueByLowCaseName("_hobject", controlHandle);
            // sub.klass.setVarValueByLowCaseName("iditem", -1);
            // sub.klass.setVarValueByLowCaseName("wnotifycode", 768); //EN_CHANGE = 768
            GraphicSpace.setKlassDoubleValueByLowCaseName(sub, "msg", code);
            GraphicSpace.setKlassLongValueByLowCaseName(sub, "_hobject", controlHandle);
            GraphicSpace.setKlassDoubleValueByLowCaseName(sub, "iditem", -1);
            GraphicSpace.setKlassDoubleValueByLowCaseName(sub, "wnotifycode", 768); //EN_CHANGE = 768
        });
    }

    private dispatchMouseEvent(code: MessageCode, x: number, y: number) {
        this.subs.forEach((sub) => {
            const shouldReceiveEvent =
                (sub.msg === code || sub.msg === MessageCode.WM_ALLMOUSEMESSAGE) && //совпадает ли код сообщения
                ((sub.objectHandle ? this.scene.testVisualIntersection(sub.objectHandle, x, y) : true) ||
                    sub.klass.isCapturingEvents(this.handle));

            if (!shouldReceiveEvent || !sub.klass.canReceiveEvents) return;
            // sub.klass.setVarValueByLowCaseName("msg", code);
            // sub.klass.setVarValueByLowCaseName("xpos", x);
            // sub.klass.setVarValueByLowCaseName("ypos", y);
            // sub.klass.setVarValueByLowCaseName("fwkeys", 0);
            GraphicSpace.setKlassDoubleValueByLowCaseName(sub, "msg", code);
            GraphicSpace.setKlassDoubleValueByLowCaseName(sub, "xpos", x);
            GraphicSpace.setKlassDoubleValueByLowCaseName(sub, "ypos", y);
            GraphicSpace.setKlassDoubleValueByLowCaseName(sub, "fwkeys", 0);
            sub.klass.computeSchemeRecursive(sub.ctx, true);
        });
    }

    findObjectByName(objectName: string, group?: GroupObject): GraphicObject | undefined {
        if (!group) {
            for (const obj of this.allObjects.values()) if (obj.name === objectName) return obj;
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
    isIntersect(obj: GraphicObject, obj2: GraphicObject): VmBool {
        throw new Error("Method not implemented.");
    }
}
