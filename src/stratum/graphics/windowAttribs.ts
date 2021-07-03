import { parseColorRef } from "stratum/common/colorrefParsers";
import { BrushToolParams, PenToolParams, VectorDrawing, VectorDrawingElement } from "stratum/fileFormats/vdr";
import { GroupElement2D, GroupElement2DArgs } from "./scene/elements/groupElement2d";
import { LineElement2DArgs } from "./scene/elements/lineElement2d";
import { PrimaryElement, Scene, SceneElement } from "./scene/scene";
import { BrushTool, BrushToolArgs } from "./scene/tools/brushTool";
import { PenTool, PenToolArgs } from "./scene/tools/penTool";
import { SceneConstructor, ToolsAndElementsConstructors } from "./toolsAndElementsConstructors";

export interface WindowAttribs {
    useVdrSettings?: boolean;
    child?: boolean;
    popup?: boolean;
    noResize?: boolean;
    autoOrg?: boolean;
    bySpaceSize?: boolean;
    noCaption?: boolean;
    noShadow?: boolean;
    vscroll?: boolean;
    hscroll?: boolean;
}

export function parseWindowAttribs(attrib: string): WindowAttribs {
    const a = attrib.toUpperCase();
    return {
        useVdrSettings: a.includes("WS_BYSPACE"),
        child: a.includes("WS_CHILD"),
        popup: a.includes("WS_POPUP"),
        noResize: a.includes("WS_NORESIZE"),
        autoOrg: a.includes("WS_AUTOORG"),
        bySpaceSize: a.includes("WS_SPACESIZE"),
        noCaption: a.includes("WS_NOCAPTION"),
        noShadow: a.includes("WS_NOSHADOW"),
        vscroll: a.includes("WS_VSCROLL"),
        hscroll: a.includes("WS_HSCROLL"),
    };
}

export function createPenTools(scene: Scene, constr: ToolsAndElementsConstructors, tools?: PenToolParams[]): Map<number, PenTool> {
    const arr = tools?.map<[number, PenTool]>((t) => {
        const args: PenToolArgs = {
            handle: t.handle,
            color: t.color,
            rop: t.rop2,
            style: t.style,
            width: t.width,
        };
        return [t.handle, new constr.pen(scene, args)];
    });
    return new Map(arr);
}

export function createBrushTools(scene: Scene, constr: ToolsAndElementsConstructors, tools?: BrushToolParams[]): Map<number, BrushTool> {
    const arr = tools?.map<[number, BrushTool]>((t) => {
        const args: BrushToolArgs = {
            handle: t.handle,
            color: t.color,
            rop: t.rop2,
            style: t.style,
            hatch: t.handle,
        };
        return [t.handle, new constr.brush(scene, args)];
    });
    return new Map(arr);
}

function parseSeletable(opts: number): number {
    return opts & 8 ? 0 : 1;
}

function parseLayer(opts: number): number {
    const layerNumber = (opts >> 8) & 0b11111;
    return 1 << layerNumber;
}

export interface CreateElementsTools {
    pens: Map<number, PenTool>;
    brushes: Map<number, BrushTool>;
}

export function createElements(
    scene: Scene,
    tools: CreateElementsTools,
    constr: ToolsAndElementsConstructors,
    elements?: VectorDrawingElement[]
): Map<number, SceneElement> {
    const groups = new Set<{ g: GroupElement2D; h: number[] }>();
    const mapFunc: (e: VectorDrawingElement) => [number, SceneElement] = (e) => {
        switch (e.type) {
            case "group": {
                const groupArgs: GroupElement2DArgs = {
                    handle: e.handle,
                    name: e.name,
                    meta: e.hyperbase,
                };
                const g = new GroupElement2D(scene, groupArgs);
                groups.add({ g, h: e.childHandles });
                return [e.handle, g];
            }
            case "line": {
                const lineArgs: LineElement2DArgs = {
                    handle: e.handle,
                    name: e.name,
                    meta: e.hyperbase,
                    layer: parseLayer(e.options),
                    pen: tools.pens.get(e.penHandle),
                    brush: tools.brushes.get(e.brushHandle),
                };
                return [e.handle, new constr.line(scene, e.coords, lineArgs)];
            }
            case "text": {
                const l2: LineElement2DArgs = {
                    handle: e.handle,
                    name: e.name,
                    meta: e.hyperbase,
                    layer: parseLayer(e.options),
                    pen: new constr.pen(scene, { color: parseColorRef("rgb(100,0,0)") }),
                };
                //prettier-ignore
                const c = [
                    e.originX, e.originY,
                    e.originX, e.originY + e.height,
                    e.originX + e.width, e.originY + e.height,
                    e.originX + e.width, e.originY,
                ]
                return [e.handle, new constr.line(scene, c, l2)];
            }
            case "control":
                throw Error();
            case "bitmap":
            case "doubleBitmap": {
                const l2: LineElement2DArgs = {
                    handle: e.handle,
                    name: e.name,
                    meta: e.hyperbase,
                    layer: parseLayer(e.options),
                    pen: new constr.pen(scene, { color: parseColorRef("rgb(0,100,0)") }),
                };
                //prettier-ignore
                const c = [
                    e.originX, e.originY,
                    e.originX, e.originY + e.height,
                    e.originX + e.width, e.originY + e.height,
                    e.originX + e.width, e.originY,
                ]
                return [e.handle, new constr.line(scene, c, l2)];
            }
            case "view3D":
                throw Error("3D проекции не поддерживаются");
        }
    };

    const objects = new Map(elements?.map(mapFunc));

    groups.forEach(({ g, h }) => {
        const children = h.map<SceneElement>((h) => {
            const o = objects.get(h);
            if (!o) throw Error(`Объект ${h} не найден`);
            return o;
        });
        g.setChildren(children);
    });

    return objects;
}

export function createElementOrder(order: number[], objects: Map<number, SceneElement>): PrimaryElement[] {
    return order.map<PrimaryElement>((handle) => {
        const obj = objects.get(handle);
        if (!obj || obj.type === "group") throw Error("Попытка добавить объект неподходящего типа");
        return obj;
    });
}

export function sceneFromVDR(sceneConstr: SceneConstructor, vdr?: VectorDrawing | null): Scene {
    // порядок важен - некоторые инструменты зависят от других.
    this.pens = new Map(vdr.penTools?.map((t) => [t.handle, new PenTool(t)]));
    this.dibs = new Map(vdr.dibTools?.map((t) => [t.handle, new DIBTool(t)]));
    this.brushes = new Map(vdr.brushTools?.map((t) => [t.handle, new BrushTool(this, t)]));
    this.doubleDibs = new Map(vdr.doubleDibTools?.map((t) => [t.handle, new DIBTool(t)]));
    this.strings = new Map(vdr.stringTools?.map((t) => [t.handle, new StringTool(t)]));
    this.fonts = new Map(vdr.fontTools?.map((t) => [t.handle, new FontTool(t)]));
    this.texts = new Map(vdr.textTools?.map((t) => [t.handle, new TextTool(this, t)]));

    this.brush = (vdr.brushHandle > 0 && this.brushes.get(vdr.brushHandle)) || null;
    this.brush?.subscribe(this);

    this.matrix = vdr.crdSystem?.matrix.slice() || [1, 0, 0, 0, 1, 0, 0, 0, 1];
    this.invMatrix = vdr.crdSystem ? Scene.getInversedMatrix(this.matrix) : [1, 0, 0, 0, 1, 0, 0, 0, 1];

    this._originX = vdr.origin.x;
    this._originY = vdr.origin.y;
    this.layers = vdr.layers;
    this._scale = 1;
    if (this._scale !== 1) {
        view.style.setProperty("transform-origin", `top left`);
        view.style.setProperty("transform", `scale(${this._scale})`);
    }

    const groups = new Set<{ g: SceneGroup; h: number[] }>();
    const mapFunc: (e: VectorDrawingElement) => [number, SceneObject] = (e) => {
        switch (e.type) {
            case "group":
                const g = new SceneGroup(this, e);
                groups.add({ g, h: e.childHandles });
                return [e.handle, g];
            case "line":
                return [e.handle, new SceneLine(this, e)];
            case "text":
                return [e.handle, new SceneText(this, e)];
            case "control":
                return [e.handle, new SceneControl(this, e)];
            case "bitmap":
            case "doubleBitmap":
                return [e.handle, new SceneBitmap(this, e)];
            case "view3D":
                throw Error("3D проекции не поддерживаются");
        }
    };
    this.objects = new Map(vdr.elements?.map(mapFunc));
    groups.forEach((e) => e.g.addChildren(e.h));

    this.primaryObjects = [];
    vdr.elementOrder?.forEach((handle) => {
        const obj = this.objects.get(handle);
        if (!obj || obj.type === 3) return;
        this.primaryObjects.push(obj);
    });
}
