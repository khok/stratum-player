import { VdrMerger } from "stratum/common/vdrMerger";
import {
    BrushToolParams,
    FontToolParams,
    ImageToolParams,
    PenToolParams,
    StringToolParams,
    TextToolParams,
    VectorDrawing,
    VectorDrawingElement,
    WindowStyle,
} from "stratum/fileFormats/vdr";
import { HardHiddenVisibilityComponent } from "stratum/graphics/scene/components/hardHiddenVisibilityComponent";
import { VisibilityComponent } from "stratum/graphics/scene/components/visibilityComponent";
import { GroupElement2D, GroupElement2DArgs } from "stratum/graphics/scene/elements/groupElement2d";
import { ImageElement2DArgs } from "stratum/graphics/scene/elements/imageElement2d";
import { InputElement2DArgs } from "stratum/graphics/scene/elements/inputElement2d";
import { LineElement2DArgs } from "stratum/graphics/scene/elements/lineElement2d";
import { TextElement2DArgs } from "stratum/graphics/scene/elements/textElement2d";
import { PrimaryElement, Scene, SceneElement } from "stratum/graphics/scene/scene";
import { BrushTool, BrushToolArgs } from "stratum/graphics/scene/tools/brushTool";
import { FontTool, FontToolArgs } from "stratum/graphics/scene/tools/fontTool";
import { ImageTool, ImageToolArgs } from "stratum/graphics/scene/tools/imageTool";
import { PenTool, PenToolArgs } from "stratum/graphics/scene/tools/penTool";
import { StringTool, StringToolArgs } from "stratum/graphics/scene/tools/stringTool";
import { TextTool, TextToolArgs, TextToolPartData } from "stratum/graphics/scene/tools/textTool";
import { Point2D } from "stratum/helpers/types";
import { ViewContainerOptions, ViewContainerSize } from "stratum/stratum";
import { graphicsImpl } from "./toolsAndElementsConstructors";

export interface OpenWindowParams extends ViewContainerOptions {
    sceneOrg: Point2D | null;
    isChild: boolean;
    vdr?: VectorDrawing | null;
}

export function parseParameters(attribs: string, vdr?: VectorDrawing | null): OpenWindowParams {
    const a = attribs.toUpperCase();
    const isChild = a.includes("WS_CHILD");
    const a_useVdrSettings = a.includes("WS_BYSPACE");
    const a_popup = a.includes("WS_POPUP");
    const a_noResize = a.includes("WS_NORESIZE");
    const a_autoOrg = a.includes("WS_AUTOORG");
    const a_bySpaceSize = a.includes("WS_SPACESIZE");
    const a_noCaption = a.includes("WS_NOCAPTION");
    const a_noShadow = a.includes("WS_NOSHADOW");
    const a_vscroll = a.includes("WS_VSCROLL");
    const a_hscroll = a.includes("WS_HSCROLL");

    let size: ViewContainerSize | null = null; // = { width: 300, height: 200 };
    let hScroll: boolean = false;
    let vScroll: boolean = false;
    let bySpaceSize = false;
    let noResize: boolean = false;
    let isPopup: boolean = false;
    let calcOrg = false;
    let noCaption: boolean = false;
    let noShadow: boolean = false;

    if (a_useVdrSettings && vdr?.settings) {
        const settings = vdr.settings;
        if (settings.x && settings.y) {
            size = { width: settings.x, height: settings.y };
        }

        const style = settings.style;
        if (style & WindowStyle.SWF_HSCROLL) hScroll = true;
        if (style & WindowStyle.SWF_VSCROLL) vScroll = true;
        if (style & WindowStyle.SWF_SPACESIZE) bySpaceSize = true;
        if (style & WindowStyle.SWF_NORESIZE) noResize = true;
        if (style & WindowStyle.SWF_POPUP) isPopup = true;
        if (style & WindowStyle.SWF_AUTOORG) calcOrg = true;
    }

    if (a_hscroll) hScroll = true;
    if (a_vscroll) vScroll = true;
    if (a_bySpaceSize) bySpaceSize = true;
    if (a_noResize) noResize = true;
    if (a_popup) isPopup = true;
    if (a_autoOrg) calcOrg = true;
    if (a_noCaption) noCaption = true;
    if (a_noShadow) noShadow = true;

    let sceneOrg: Point2D | null = null;

    if (vdr?.elements && (calcOrg || bySpaceSize)) {
        const org = VdrMerger.calcRect(vdr.elements);
        if (calcOrg) {
            sceneOrg = { x: org.x, y: org.y };
        }
        if (bySpaceSize) {
            size = { width: org.w, height: org.h };
        }
    }

    return {
        sceneOrg,
        isChild,
        vdr,
        isPopup,
        hScroll,
        noCaption,
        noResize,
        position: null,
        size,
        vScroll,
        title: null,
        noShadow,
    };
}

export function createPenTools(scene: Scene, tools?: PenToolParams[]): Map<number, PenTool> {
    const arr = tools?.map<[number, PenTool]>((t) => {
        const args: PenToolArgs = {
            handle: t.handle,
            color: t.color,
            rop: t.rop2,
            style: t.style,
            width: t.width,
        };
        return [t.handle, new graphicsImpl.pen(scene, args)];
    });
    return new Map(arr);
}

export function createBrushTools(scene: Scene, dibs: Map<number, ImageTool>, tools?: BrushToolParams[]): Map<number, BrushTool> {
    const arr = tools?.map<[number, BrushTool]>((t) => {
        const args: BrushToolArgs = {
            handle: t.handle,
            color: t.color,
            rop: t.rop2,
            style: t.style,
            hatch: t.handle,
            image: dibs.get(t.dibHandle),
        };
        return [t.handle, new graphicsImpl.brush(scene, args)];
    });
    return new Map(arr);
}

export function createImageTools(scene: Scene, tools?: ImageToolParams[]): Map<number, ImageTool> {
    const arr = tools?.map<[number, ImageTool]>((t) => {
        const img = t.type === "image" ? t.img : null; //WIP сделать класс загрузки иконок.
        const args: ImageToolArgs = {
            handle: t.handle,
        };
        return [t.handle, new graphicsImpl.dib(scene, img, args)];
    });
    return new Map(arr);
}

export function createFontTools(scene: Scene, tools?: FontToolParams[]): Map<number, FontTool> {
    const arr = tools?.map<[number, FontTool]>((t) => {
        const args: FontToolArgs = {
            handle: t.handle,
            name: t.fontName,
            style: (t.italic ? 1 : 0) | (t.underline ? 2 : 0) | (t.strikeOut ? 4 : 0) | (t.weight ? 8 : 0),
        };
        return [t.handle, new graphicsImpl.font(scene, t.height < 0 ? t.height * -1 : t.height, args)];
    });
    return new Map(arr);
}

export function createStringTools(scene: Scene, tools?: StringToolParams[]): Map<number, StringTool> {
    const arr = tools?.map<[number, StringTool]>((t) => {
        const args: StringToolArgs = { handle: t.handle };
        return [t.handle, new graphicsImpl.str(scene, t.text, args)];
    });
    return new Map(arr);
}

export function createTextTools(scene: Scene, fonts: Map<number, FontTool>, strings: Map<number, StringTool>, tools?: TextToolParams[]): Map<number, TextTool> {
    const arr = tools?.map<[number, TextTool]>((t) => {
        const parts = t.textCollection.map<TextToolPartData>((c) => {
            const font = fonts.get(c.fontHandle);
            if (!font) throw Error(`Инструмент Шрифт #${c.fontHandle} не найден`);
            const str = strings.get(c.stringHandle);
            if (!str) throw Error(`Инструмент Строка #${c.stringHandle} не найден`);
            return { fgColor: c.fgColor, bgColor: c.bgColor, font, str };
        });
        const args: TextToolArgs = { handle: t.handle };
        return [t.handle, new graphicsImpl.ttool(scene, parts, args)];
    });
    return new Map(arr);
}

function parseHardHidden(opts: number): boolean {
    return !!(opts & 1);
}

function parseSeleсtable(opts: number): boolean {
    return !(opts & 8);
}

function parseLayer(opts: number): number {
    const layerNumber = (opts >> 8) & 0b11111;
    return 1 << layerNumber;
}

export interface CreateElementsTools {
    pens: Map<number, PenTool>;
    brushes: Map<number, BrushTool>;
    dibs: Map<number, ImageTool>;
    doubleDibs: Map<number, ImageTool>;
    texts: Map<number, TextTool>;
}

export function createElements(scene: Scene, tools: CreateElementsTools, elements?: VectorDrawingElement[]): Map<number, SceneElement> {
    const groups = new Set<{ g: GroupElement2D; h: number[] }>();
    const mapFunc: (e: VectorDrawingElement) => [number, SceneElement] = (e) => {
        const layer = parseLayer(e.options);
        const visib = new VisibilityComponent(scene, true, layer);

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
                const args: LineElement2DArgs = {
                    handle: e.handle,
                    name: e.name,
                    meta: e.hyperbase,
                    visib,
                    pen: tools.pens.get(e.penHandle),
                    brush: tools.brushes.get(e.brushHandle),
                };
                return [e.handle, new graphicsImpl.line(scene, e.coords, args)];
            }
            case "text": {
                const tool = tools.texts.get(e.textToolHandle);
                if (!tool) throw Error(`Инструмент Текст #${e.textToolHandle} не найден`);

                const args: TextElement2DArgs = {
                    handle: e.handle,
                    name: e.name,
                    meta: e.hyperbase,
                    x: e.originX,
                    y: e.originY,
                    width: e.width,
                    height: e.height,
                    angle: ((-e.angle / 10) * Math.PI) / 180,
                    visib,
                };
                return [e.handle, new graphicsImpl.text(scene, tool, args)];
            }
            case "control": {
                if (e.inputType !== "EDIT") throw Error(`Элемент ввода ${e.inputType} не реализован.`);
                const args: InputElement2DArgs = {
                    handle: e.handle,
                    name: e.name,
                    meta: e.hyperbase,
                    x: e.originX,
                    y: e.originY,
                    width: e.width,
                    height: e.height,
                    text: e.text,
                    visib,
                };
                return [e.handle, new graphicsImpl.input(scene, args)];
            }
            case "bitmap":
            case "doubleBitmap": {
                const isTransparent = e.type === "doubleBitmap";
                const img = (isTransparent ? tools.doubleDibs : tools.dibs).get(e.dibHandle);
                if (!img) throw Error(`Инструмент битовая карта #${e.dibHandle} не найден`);

                const hardHidden = parseHardHidden(e.options);
                const args: ImageElement2DArgs = {
                    handle: e.handle,
                    name: e.name,
                    meta: e.hyperbase,
                    x: e.originX,
                    y: e.originY,
                    width: hardHidden ? 1 : e.width,
                    height: hardHidden ? 1 : e.height,
                    visib: hardHidden ? new HardHiddenVisibilityComponent(scene, true, layer) : visib,
                    crop: {
                        x: e.cropX,
                        y: e.cropY,
                        w: e.cropW,
                        h: e.cropH,
                    },
                };
                return [e.handle, new graphicsImpl.bitmap(scene, isTransparent, img, args)];
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

// export function sceneFromVDR(sceneConstr: SceneConstructor, vdr?: VectorDrawing | null): Scene {
//     // порядок важен - некоторые инструменты зависят от других.
//     this.pens = new Map(vdr.penTools?.map((t) => [t.handle, new PenTool(t)]));
//     this.dibs = new Map(vdr.dibTools?.map((t) => [t.handle, new DIBTool(t)]));
//     this.brushes = new Map(vdr.brushTools?.map((t) => [t.handle, new BrushTool(this, t)]));
//     this.doubleDibs = new Map(vdr.doubleDibTools?.map((t) => [t.handle, new DIBTool(t)]));
//     this.strings = new Map(vdr.stringTools?.map((t) => [t.handle, new StringTool(t)]));
//     this.fonts = new Map(vdr.fontTools?.map((t) => [t.handle, new FontTool(t)]));
//     this.texts = new Map(vdr.textTools?.map((t) => [t.handle, new TextTool(this, t)]));

//     this.brush = (vdr.brushHandle > 0 && this.brushes.get(vdr.brushHandle)) || null;
//     this.brush?.subscribe(this);

//     this.matrix = vdr.crdSystem?.matrix.slice() || [1, 0, 0, 0, 1, 0, 0, 0, 1];
//     this.invMatrix = vdr.crdSystem ? Scene.getInversedMatrix(this.matrix) : [1, 0, 0, 0, 1, 0, 0, 0, 1];

//     this._originX = vdr.origin.x;
//     this._originY = vdr.origin.y;
//     this.layers = vdr.layers;
//     this._scale = 1;
//     if (this._scale !== 1) {
//         view.style.setProperty("transform-origin", `top left`);
//         view.style.setProperty("transform", `scale(${this._scale})`);
//     }

//     const groups = new Set<{ g: SceneGroup; h: number[] }>();
//     const mapFunc: (e: VectorDrawingElement) => [number, SceneObject] = (e) => {
//         switch (e.type) {
//             case "group":
//                 const g = new SceneGroup(this, e);
//                 groups.add({ g, h: e.childHandles });
//                 return [e.handle, g];
//             case "line":
//                 return [e.handle, new SceneLine(this, e)];
//             case "text":
//                 return [e.handle, new SceneText(this, e)];
//             case "control":
//                 return [e.handle, new SceneControl(this, e)];
//             case "bitmap":
//             case "doubleBitmap":
//                 return [e.handle, new SceneBitmap(this, e)];
//             case "view3D":
//                 throw Error("3D проекции не поддерживаются");
//         }
//     };
//     this.objects = new Map(vdr.elements?.map(mapFunc));
//     groups.forEach((e) => e.g.addChildren(e.h));

//     this.primaryObjects = [];
//     vdr.elementOrder?.forEach((handle) => {
//         const obj = this.objects.get(handle);
//         if (!obj || obj.type === 3) return;
//         this.primaryObjects.push(obj);
//     });
// }
