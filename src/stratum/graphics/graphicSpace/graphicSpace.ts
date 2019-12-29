import { Point2D, VectorDrawData } from "data-types-graphics";
import { Scene } from "scene-types";
import { VmBool } from "vm-interfaces-base";
import { GraphicSpaceState } from "vm-interfaces-graphics";
import { HandleMap } from "~/helpers/handleMap";
import { GraphicSpaceTools } from "./graphicSpaceTools";
import { GraphicObject, GroupObject } from "./objects";
import { createObjects, createTools } from "./createToolsAndObjects";
import { ImageResolver } from "internal-graphic-types";

/**
 * Графическое пространство, содержащее инструменты и объекты.
 */
export class GraphicSpace implements GraphicSpaceState {
    static fromVdr(vdr: VectorDrawData, imageLoader: ImageResolver, scene: Scene) {
        const tools = createTools(vdr, imageLoader);
        const objects = vdr.elements && createObjects(vdr.elements, tools, scene);
        const space = new GraphicSpace({ origin: vdr.origin, tools, objects }, scene);
        if (vdr.elementOrder) space.placeObjects(vdr.elementOrder);
        return space;
    }

    handle = 0;
    /**
     * Инструменты графического пространства.
     */
    readonly tools: GraphicSpaceTools;
    private _originX: number = 0;
    private _originY: number = 0;
    /**
     * Перечень объектов, существующих в графическом пространстве.
     */
    private allObjects = HandleMap.create<GraphicObject>();
    constructor(
        {
            origin,
            tools,
            objects
        }: {
            origin: Point2D;
            tools?: GraphicSpaceTools;
            objects?: HandleMap<GraphicObject>;
        },
        public scene: Scene
    ) {
        this.setOrigin(origin.x, origin.y);
        this.tools = tools || new GraphicSpaceTools();
        if (objects) objects.forEach((o, k) => this.addObjectFast(o, k));
    }

    /**
     * Размещает объекты на сцене согласно указанном порядку `order`
     * @param order - массив дескрипторов объектов, от дальнего к ближнему
     */
    placeObjects(order: number[]) {
        this.scene.placeObjects(order);
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

    addObject(obj: GraphicObject): number {
        throw new Error("Method not implemented.");
        // this.deleteObject(handle);
        // else handle = this.allObjects.getFreeHandle();
        const handle = HandleMap.getFreeHandle(this.allObjects);
        this.addObjectFast(obj, handle);
        //TODO: object zOrder???
        // if (obj.type !== "otGROUP2D") this.scene.
        return handle;
    }

    private addObjectFast(obj: GraphicObject, handle: number) {
        obj.handle = handle;
        this.allObjects.set(handle, obj);
        // if (obj.type !== "otGROUP2D") this.objectVisuals.set(handle, obj.visual);
    }

    getObject(handle: number): GraphicObject | undefined {
        if (handle === 0) return undefined;
        return this.allObjects.get(handle);
    }

    deleteObject(handle: number): VmBool {
        const obj = this.allObjects.get(handle);
        if (!obj) return 0;
        this.allObjects.delete(handle);
        return 1;
    }

    findObjectByName(objectName: string, group?: GroupObject): GraphicObject | undefined {
        if (group) console.log(`findObjectByName(#${group.handle}, ${objectName})`);
        const iterator = group ? group.items : this.allObjects.values();
        for (const obj of iterator) if (obj.name === objectName) return obj;
        return undefined;
    }

    getObjectHandleFromPoint(x: number, y: number): number {
        return this.scene.getVisualHandleFromPoint(x, y);
    }

    getObjectFromPoint(x: number, y: number) {
        const handle = this.getObjectHandleFromPoint(x, y);
        return this.getObject(handle);
    }
}
