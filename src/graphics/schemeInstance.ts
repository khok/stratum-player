import { StratumImage } from "../deserializers";
import { IGraphicObject, ISchemeInstance } from "../vm";
import { GraphicElement, Group } from "../deserializers/graphicElements";
import { fabric } from "fabric";
import { StratumError } from "../errors";

function constructImage(image: StratumImage, spaceTopLeft: { x: number; y: number }) {
    const { elements, brushes, pens } = image;
    const objects = new Map<number, GraphicObject>();
    const iterator = elements.entries();
    const groupData: { handle: number; proto: Group }[] = [];
    for (let iter = iterator.next(); !iter.done; iter = iterator.next()) {
        const [handle, proto] = iter.value;

        const opts: fabric.IObjectOptions = {
            name: proto.name,
            visible: (proto.options & 0x0001) == 0
        };
        if (proto.type != "group") {
            const { position } = proto;
            opts.top = position.y - spaceTopLeft.y;
            opts.left = position.x - spaceTopLeft.x;
        }
        let obj;
        switch (proto.type) {
            case "line":
                const { brushHandle, penHandle } = proto;
                if (brushHandle) opts.fill = brushes!.get(brushHandle)!.color;
                if (penHandle) {
                    const pen = pens!.get(penHandle)!;
                    opts.strokeWidth = pen.width || 0.5; //минимально возможная толщина (придумал сам)
                    opts.stroke = pen.color;
                }
                //any - костыль против readonly
                obj = new fabric.Polyline(<any>proto.points, opts);
                break;
            case "text":
                throw new Error("Text Not implemented.");
            case "group":
                // obj = new fabric.Group(undefined, opts);
                groupData.push({ handle, proto });
                continue;
            case "bitmap":
                const { data } = proto;
                obj = new fabric.Rect({ ...opts, fill: "gray", width: data.size.x, height: data.size.y });
                break;
            case "control":
                throw new Error("Control Not implemented.");
            default:
                throw new Error(`Неизвестный тип объекта`);
        }
        objects.set(handle, new GraphicObject(obj));
    }
    const groups = new Map<number, number[]>();
    for (const { handle, proto } of groupData) {
        for (const childH of proto.items) {
            const ret = objects.get(childH);
            if (!ret) throw new StratumError(`Ошибка создания группы ${handle}: объект ${childH} не найден на схеме`);
            ret.parentHandle = handle;
        }
        groups.set(handle, proto.items.slice());
    }
    return { objects, groups };
}

class GraphicObject implements IGraphicObject {
    // size: { x: number; y: number };
    parentHandle = 0;
    zOrder = 0;
    constructor(public obj: fabric.Object) {}
    get size(): { x: number; y: number } {
        throw "nimp";
    }
    get left() {
        return this.obj.left!;
    }
    get top() {
        return this.obj.top!;
    }
    setPosition(x: number, y: number): boolean {
        this.obj.set({ top: y, left: x }).setCoords();
        return true;
    }
    rotate(centerX: number, centerY: number, angleRad: number): boolean {
        return true;
    }
    setSize(width: number, height: number): boolean {
        throw new Error("Method not implemented.");
    }
    setZOrder(order: number): boolean {
        throw new Error("Method not implemented.");
    }
    setVisible(visible: boolean): boolean {
        throw new Error("Method not implemented.");
    }
}

export default class SchemeInstance implements ISchemeInstance {
    scale: number = 0;
    topLeft: { x: number; y: number } = { x: 0, y: 0 };
    size: { x: number; y: number } = { x: 0, y: 0 };
    objects: Map<number, GraphicObject>;
    canvas: fabric.Canvas;
    constructor(image: StratumImage, htmlCanvas: HTMLCanvasElement) {
        console.dir(image);
        this.canvas = new fabric.Canvas(htmlCanvas, {
            preserveObjectStacking: true
        });
        const { topLeft, elementOrder } = image;
        this.setTopLeft(topLeft.x, topLeft.y);
        const { groups, objects } = constructImage(image, topLeft);
        elementOrder.forEach(h => {
            const el = objects.get(h);
            if (!el) throw new StratumError(`Объект ${h} не найден на схеме`);
            this.canvas.add(el.obj);
        });
        this.objects = objects;
    }
    getObjectHandleFromPoint(x: number, y: number): number {
        throw new Error("Method not implemented.");
    }
    findObjectHandle(groupHandle: number, objectName: string): number {
        throw new Error("Method not implemented.");
    }
    getObject(objectHandle: number): IGraphicObject | undefined {
        throw new Error("Method not implemented.");
    }
    setTopLeft(x: number, y: number): boolean {
        this.topLeft.x = x;
        this.topLeft.y = y;
        return true;
    }
    setScale(scale: number): boolean {
        throw new Error("Method not implemented.");
    }
}
