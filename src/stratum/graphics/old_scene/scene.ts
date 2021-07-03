import { Constant } from "stratum/common/constant";
import { EventSubscriber, HyperCallHandler, NumBool } from "stratum/common/types";
import { DibToolImage } from "stratum/fileFormats/bmp/dibToolImage";
import { Hyperbase, VectorDrawing, VectorDrawingElement } from "stratum/fileFormats/vdr";
import { HandleMap } from "stratum/helpers/handleMap";
import { eventCodeToWinDigit } from "stratum/helpers/keyboardEventKeyMap";
import { win1251Table } from "stratum/helpers/win1251";
import { WindowHostWindow } from "stratum/stratum";
import { SceneWindow, WindowRect } from "../sceneWindow";
import { NotResizable, Resizable } from "./resizable";
import { SceneBitmap } from "./sceneBitmap";
import { SceneControl } from "./sceneControl";
import { SceneGroup } from "./sceneGroup";
import { SceneLine } from "./sceneLine";
import { SceneSubframe } from "./sceneSubframe";
import { SceneText } from "./sceneText";
import { BrushTool } from "./tools/brushTool";
import { DIBTool } from "./tools/dibTool";
import { FontTool } from "./tools/fontTool";
import { PenTool } from "./tools/penTool";
import { StringTool } from "./tools/stringTool";
import { TextTool } from "./tools/textTool";
import { ToolStorage } from "./tools/toolStorage";
import { ToolSubscriber } from "./tools/toolSubscriber";

type PrimaryObject = SceneLine | SceneBitmap | SceneText | SceneControl;
type SceneObject = PrimaryObject | SceneGroup;

export interface SceneArgs {
    /**
     * HTMLCanvasElement, на котором производится отрисовка и подписка на события мыши.
     */
    wnd: SceneWindow;
    sizeInfo: Resizable | NotResizable;
    vdr?: VectorDrawing | null;
}

export class Scene implements ToolStorage, ToolSubscriber, EventListenerObject {
    private static kbdTarget: Scene | null = null;
    private static captureTarget: Scene | null = null;
    static handleKeyboard(evt: KeyboardEvent) {
        const code = eventCodeToWinDigit.get(evt.code);
        if (typeof code !== "undefined") {
            Scene.keyState[code] = evt.type === "keydown" ? 1 : 0;
        }
        Scene.kbdTarget?.dispatchKeyboardEvent(evt, code ?? 0);
    }
    private static _mouseX: number = 0;
    private static _mouseY: number = 0;
    static handlePointer(evt: PointerEvent) {
        Scene.keyState[1] = evt.buttons & 1 ? 1 : 0;
        Scene.keyState[2] = evt.buttons & 2 ? 1 : 0;
        Scene.keyState[4] = evt.buttons & 4 ? 1 : 0;
        Scene._mouseX = evt.clientX;
        Scene._mouseY = evt.clientY;
        Scene.captureTarget?.handleEvent(evt);
    }
    static readonly keyState = new Uint8Array(256);

    static mouseCoords(scene: Scene): [number, number] {
        const rect = scene.ctx.canvas.getBoundingClientRect();
        const clickX = (Scene._mouseX - rect.left) / scene._scale;
        const clickY = (Scene._mouseY - rect.top) / scene._scale;
        return [clickX, clickY];
    }

    private static getInversedMatrix(matrix: number[]): number[] {
        const det =
            matrix[0] * (matrix[4] * matrix[8] - matrix[7] * matrix[5]) -
            matrix[1] * (matrix[3] * matrix[8] - matrix[5] * matrix[6]) +
            matrix[2] * (matrix[3] * matrix[7] - matrix[4] * matrix[6]);

        return [
            (matrix[4] * matrix[8] - matrix[7] * matrix[5]) / det,
            (matrix[2] * matrix[7] - matrix[1] * matrix[8]) / det,
            (matrix[1] * matrix[5] - matrix[2] * matrix[4]) / det,
            (matrix[5] * matrix[6] - matrix[3] * matrix[8]) / det,
            (matrix[0] * matrix[8] - matrix[2] * matrix[6]) / det,
            (matrix[3] * matrix[2] - matrix[0] * matrix[5]) / det,
            (matrix[3] * matrix[7] - matrix[6] * matrix[4]) / det,
            (matrix[6] * matrix[1] - matrix[0] * matrix[7]) / det,
            (matrix[0] * matrix[4] - matrix[3] * matrix[1]) / det,
        ];
    }
    private readonly ctx: CanvasRenderingContext2D;
    private _originX: number;
    private _originY: number;
    private _scale: number;
    private layers: number;
    private brush: BrushTool | null;
    primaryObjects: PrimaryObject[];
    private sizeInfo: Resizable | NotResizable;

    readonly view: HTMLDivElement;
    readonly wnd: SceneWindow;
    readonly matrix: number[];
    readonly invMatrix: number[];

    hyperHandler: HyperCallHandler | null;
    objects: Map<number, SceneObject>;
    pens: Map<number, PenTool>;
    brushes: Map<number, BrushTool>;
    dibs: Map<number, DIBTool>;
    doubleDibs: Map<number, DIBTool>;
    strings: Map<number, StringTool>;
    fonts: Map<number, FontTool>;
    texts: Map<number, TextTool>;
    dirty: boolean;

    constructor({ wnd, vdr, sizeInfo }: SceneArgs) {
        this.wnd = wnd;
        this.sizeInfo = sizeInfo;
        this.dirty = true;
        this.hyperHandler = null;
        // Вьюха.
        const view = (this.view = document.createElement("div"));
        view.style.setProperty("overflow", "hidden"); //скрываем любые дочерние инпуты, которые вылазят за границу.
        view.style.setProperty("position", "relative"); //нужно, т.к. дочерние input-ы позиционируются абсолютно.
        if (sizeInfo.resizable) {
            view.style.setProperty("width", "100%");
            view.style.setProperty("height", "100%");
        } else {
            view.style.setProperty("width", sizeInfo.width + "px");
            view.style.setProperty("height", sizeInfo.height + "px");
        }
        // Главный Canvas
        const cnv = document.createElement("canvas");
        cnv.style.setProperty("touch-action", "pinch-zoom"); //было: "pan-x pan-y". pinch-zoom работает лучше.
        cnv.addEventListener("pointerdown", this);
        cnv.addEventListener("pointerup", this);
        // cnv.addEventListener("pointerleave", this);
        cnv.addEventListener("pointermove", this);
        cnv.addEventListener("selectstart", this);
        view.appendChild(cnv);

        const ctx = cnv.getContext("2d", { alpha: false });
        if (!ctx) throw Error("Не удалось инициализировать контекст рендеринга");
        this.ctx = ctx;
        if (!vdr) {
            this._originX = 0;
            this._originY = 0;
            this._scale = 1;
            this.layers = 0;
            this.objects = new Map();
            this.primaryObjects = [];
            this.pens = new Map();
            this.brushes = new Map();
            this.dibs = new Map();
            this.doubleDibs = new Map();
            this.strings = new Map();
            this.fonts = new Map();
            this.texts = new Map();
            this.matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
            this.invMatrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
            this.brush = null;
            return;
        }
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

    toDataURL(x: number, y: number, width: number, height: number): string | null {
        const sx = Math.max(x, 0);
        const sy = Math.max(y, 0);
        const sw = Math.min(width, this.ctx.canvas.width);
        const sh = Math.min(height, this.ctx.canvas.height);

        const data = this.ctx.getImageData(sx, sy, sw, sh);
        const cnv = document.createElement("canvas");
        cnv.width = sw;
        cnv.height = sh;
        const ctx = cnv.getContext("2d", { alpha: false });
        if (!ctx) return null;
        ctx.putImageData(data, 0, 0);
        return cnv.toDataURL();
    }

    // private prev : {
    //     obj : Map<number, SceneObject>,
    //     iter : IterableIterator<SceneObject>
    // } | null = null;
    // next(hobject: number): number {
    //     const obj = this.objects.get(hobject);
    //     if (!obj) return 0;

    //     if(this.prev?.obj !== this.objects) {
    //         this.prev = {
    //             obj: this.objects,
    //             iter : this.objects.values(),
    //         }
    //     }
    //     const next = this.prev.iter.next();
    //     return next.done ? 0 : next.value.handle;
    // }
    // private prev : {
    //     obj : Map<number, SceneObject>,
    //     iter : IterableIterator<SceneObject>
    // } | null = null;
    next(hobject: number): number {
        let found = false;
        for (const [k] of this.objects) {
            if (found) return k;
            if (k === hobject) found = true;
        }
        return 0;
    }

    // setSize(width: number, height: number): void {
    //     const cnv = this.ctx.canvas;
    //     cnv.style.setProperty("width", width + "px");
    //     cnv.style.setProperty("height", height + "px");
    //     cnv.width = width;
    //     cnv.height = height;
    //     this.dirty = true;
    // }

    setHyper(hobject: number, hyper: Hyperbase | null): NumBool {
        const obj = this.objects.get(hobject);
        if (!obj) return 0;
        obj.hyperbase = hyper;
        return 1;
    }

    tryHyper(x: number, y: number, hobject: number): void {
        if (!this.hyperHandler) return;
        const h = hobject || this.getObjectFromPoint2d(x, y, false);
        const hyp = this.objects.get(h)?.hyperbase;
        if (!hyp) return;

        const mat = this.matrix;

        const w = x * mat[2] + y * mat[5] + mat[8];
        const clickX = (x * mat[0] + y * mat[3] + mat[6]) / w - this._originX;
        const clickY = (x * mat[1] + y * mat[4] + mat[7]) / w - this._originY;
        this.hyperHandler.click(hyp, { x: clickX, y: clickY });
    }

    setBrush(hBrush: number): NumBool {
        this.brush?.unsubscribe(this);
        this.brush = this.brushes.get(hBrush) || null;
        this.brush?.subscribe(this);
        this.dirty = true;
        return 1;
    }
    brushHandle(): number {
        return this.brush?.handle || 0;
    }
    clear(): NumBool {
        throw new Error("Method not implemented.");
    }
    toolChanged(): void {
        this.dirty = true;
    }

    private lastViewW = 0;
    private lastViewH = 0;
    render(): void {
        const nw = this.view.clientWidth;
        const nh = this.view.clientHeight;
        const ctx = this.ctx;

        if (nw !== this.lastViewW || nh !== this.lastViewH) {
            this.lastViewW = nw;
            this.lastViewH = nh;
            const cnv = ctx.canvas;
            cnv.style.setProperty("width", nw + "px");
            cnv.style.setProperty("height", nh + "px");
            cnv.width = nw;
            cnv.height = nh;
            this.dirty = true;

            if (this.sizeInfo.resizable) this.sizeSubs.forEach((c) => c.receive(Constant.WM_SIZE, nw, nh));
        }

        if (!this.dirty || nw < 1 || nh < 1) return;
        this.dirty = false;
        ctx.fillStyle = this.brush?.fillStyle(ctx) || "white";
        ctx.fillRect(0, 0, nw, nh);
        this.primaryObjects.forEach((o) => o.render(ctx, this._originX, this._originY, this.layers));
    }

    width(): number {
        const s = this.sizeInfo;
        return s.resizable ? this.lastViewW : s.width;
    }

    height(): number {
        const s = this.sizeInfo;
        return s.resizable ? this.lastViewH : s.height;
    }

    setSize(width: number, height: number): void {
        if (this.sizeInfo.resizable) return;
        this.sizeInfo.width = width;
        this.sizeInfo.height = height;
        this.view.style.setProperty("width", width + "px");
        this.view.style.setProperty("height", height + "px");
        this.sizeSubs.forEach((c) => c.receive(Constant.WM_SIZE, width, height));
    }

    originX(): number {
        return this._originX;
    }
    originY(): number {
        return this._originY;
    }
    setOrigin(x: number, y: number): NumBool {
        this._originX = x;
        this._originY = y;
        this.dirty = true;
        return 1;
    }

    scale(): number {
        return this._scale;
    }
    setScale(ms: number): NumBool {
        if (ms === 0) return 0;
        this._scale = ms;
        if (ms !== 1) {
            this.view.style.setProperty("transform-origin", `top left`);
            this.view.style.setProperty("transform", `scale(${ms})`);
        } else {
            this.view.style.removeProperty("transform-origin");
            this.view.style.removeProperty("transform");
        }
        return 1;
    }

    createLine(coords: number[], penHandle: number, brushHandle: number): number {
        const handle = HandleMap.getFreeHandle(this.objects);

        const mat = this.matrix;

        const realCoords = new Array(coords.length);
        for (let i = 0; i < coords.length; i += 2) {
            const x = coords[i];
            const y = coords[i + 1];
            const w = x * mat[2] + y * mat[5] + mat[8];
            realCoords[i] = (x * mat[0] + y * mat[3] + mat[6]) / w;
            realCoords[i + 1] = (x * mat[1] + y * mat[4] + mat[7]) / w;
        }
        const obj = new SceneLine(this, { handle, penHandle, brushHandle, coords: realCoords });
        this.objects.set(handle, obj);
        this.primaryObjects.push(obj);
        return handle;
    }
    createBitmap(x: number, y: number, dibHandle: number, isDouble: boolean): number {
        const mat = this.matrix;
        const w = x * mat[2] + y * mat[5] + mat[8];
        const realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        const realY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = new SceneBitmap(this, { handle, originX: realX, originY: realY, type: isDouble ? "doubleBitmap" : "bitmap", dibHandle });
        this.objects.set(handle, obj);
        this.primaryObjects.push(obj);
        return handle;
    }
    createText(x: number, y: number, angle: number, textToolHandle: number): number {
        const mat = this.matrix;
        const w = x * mat[2] + y * mat[5] + mat[8];
        const realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        const realY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = new SceneText(this, { handle, originX: realX, originY: realY, angle, textToolHandle });
        this.objects.set(handle, obj);
        this.primaryObjects.push(obj);
        return handle;
    }
    createControl(x: number, y: number, width: number, height: number, className: string, text: string, style: number): number {
        const inputType = className.toUpperCase();
        if (inputType !== "EDIT" && inputType !== "BUTTON" && inputType !== "COMBOBOX") {
            return 0;
        }

        const mat = this.matrix;
        const w = x * mat[2] + y * mat[5] + mat[8];
        const realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        const realY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = new SceneControl(this, { handle, originX: realX, originY: realY, width, height, inputType, text });
        this.objects.set(handle, obj);
        this.primaryObjects.push(obj);
        return handle;
    }

    createGroup(childHandles: number[]): number {
        const handle = HandleMap.getFreeHandle(this.objects);
        const obj = new SceneGroup(this, { handle }).addChildren(childHandles);
        this.objects.set(handle, obj);
        return handle;
    }
    private static copyed: SceneObject | null = null;
    copy(hobject: number): NumBool {
        const obj = this.objects.get(hobject);
        if (!obj) return 0;
        Scene.copyed = obj;
        return 1;
    }
    paste(x: number, y: number, flags: number): number {
        const copyed = Scene.copyed;
        if (!copyed) return 0;
        const cp = copyed.copy(this, flags) as SceneObject;
        cp.setOrigin(x, y);
        this.dirty = true;
        return cp.handle;
    }
    insertVectorDrawing(x: number, y: number, flags: number, vdr: VectorDrawing): number {
        if (!vdr.elements) return 0;

        // const mat = this.matrix;
        // const w = x * mat[2] + y * mat[5] + mat[8];
        // const realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        // const realY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        // Сохраняем текущие объекты/инструменты
        const pens = this.pens;
        const dibs = this.dibs;
        const brushes = this.brushes;
        const doubleDibs = this.doubleDibs;
        const strings = this.strings;
        const fonts = this.fonts;
        const texts = this.texts;
        const objects = this.objects;

        // Создаем новые инструменты
        this.pens = new Map(vdr.penTools?.map((t) => [t.handle, new PenTool(t)]));
        this.dibs = new Map(vdr.dibTools?.map((t) => [t.handle, new DIBTool(t)]));
        this.brushes = new Map(vdr.brushTools?.map((t) => [t.handle, new BrushTool(this, t)]));
        this.doubleDibs = new Map(vdr.doubleDibTools?.map((t) => [t.handle, new DIBTool(t)]));
        this.strings = new Map(vdr.stringTools?.map((t) => [t.handle, new StringTool(t)]));
        this.fonts = new Map(vdr.fontTools?.map((t) => [t.handle, new FontTool(t)]));
        this.texts = new Map(vdr.textTools?.map((t) => [t.handle, new TextTool(this, t)]));

        // Создаем новые объекты
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
        const obs = vdr.elements.map(mapFunc);
        this.objects = new Map(obs);
        groups.forEach((e) => e.g.addChildren(e.h));

        // Добавляем их на сцену
        vdr.elementOrder?.forEach((handle) => {
            const obj = this.objects.get(handle);
            if (!obj || obj.type === 3) return;
            this.primaryObjects.push(obj);
        });

        // Создаем группу либо определяем корневой объект
        const topChildren = obs.filter((o) => o[1].parentHandle() === 0).map((o) => o[1].handle);

        if (topChildren.length === 0) throw Error("Ошибка вставки изображения");

        let root: SceneObject;
        if (topChildren.length > 1) {
            const handle = HandleMap.getFreeHandle(this.objects);
            const obj = new SceneGroup(this, { handle }).addChildren(topChildren);
            this.objects.set(handle, obj);
            root = obj;
        } else {
            root = this.objects.values().next().value;
        }
        // FIXME: нужно проверить insertVDR с пространстве с другой координатной матрицей.
        // root.setOrigin(realX, realY);
        root.setOrigin(x, y);

        // Объединяем инструменты и объекты с имеющимися
        this.pens.forEach((e) => {
            const handle = HandleMap.getFreeHandle(pens);
            e.handle = handle;
            pens.set(handle, e);
        });
        this.dibs.forEach((e) => {
            const handle = HandleMap.getFreeHandle(dibs);
            e.handle = handle;
            dibs.set(handle, e);
        });
        this.brushes.forEach((e) => {
            const handle = HandleMap.getFreeHandle(brushes);
            e.handle = handle;
            brushes.set(handle, e);
        });
        this.doubleDibs.forEach((e) => {
            const handle = HandleMap.getFreeHandle(doubleDibs);
            e.handle = handle;
            doubleDibs.set(handle, e);
        });
        this.strings.forEach((e) => {
            const handle = HandleMap.getFreeHandle(strings);
            e.handle = handle;
            strings.set(handle, e);
        });
        this.fonts.forEach((e) => {
            const handle = HandleMap.getFreeHandle(fonts);
            e.handle = handle;
            fonts.set(handle, e);
        });
        this.texts.forEach((e) => {
            const handle = HandleMap.getFreeHandle(texts);
            e.handle = handle;
            texts.set(handle, e);
        });
        this.objects.forEach((e) => {
            const handle = HandleMap.getFreeHandle(objects);
            e.handle = handle;
            objects.set(handle, e);
        });

        // Возвращаем назад
        this.pens = pens;
        this.dibs = dibs;
        this.brushes = brushes;
        this.doubleDibs = doubleDibs;
        this.strings = strings;
        this.fonts = fonts;
        this.texts = texts;
        this.objects = objects;

        return root.handle;
    }

    frame(view: HTMLDivElement, rect: WindowRect): WindowHostWindow {
        return new SceneSubframe(view, this, rect);
    }

    deleteObject(hobject: number): NumBool {
        const obj = this.objects.get(hobject);
        if (!obj) return 0;
        obj.delete();
        this.objects = new Map([...this.objects].filter((c) => !c[1].markDeleted));
        this.primaryObjects = this.primaryObjects.filter((c) => !c.markDeleted);
        return 1;
    }
    deleteGroup2d(hgroup: number): NumBool {
        const obj = this.objects.get(hgroup);
        if (!obj || obj.type !== 3) return 0;
        obj.ungroup();
        this.objects.delete(hgroup);
        return 1;
    }

    topObjectHandle(): number {
        return this.primaryObjects.length > 0 ? this.primaryObjects[this.primaryObjects.length - 1].handle : 0;
    }
    bottomObjectHandle(): number {
        return this.primaryObjects.length > 0 ? this.primaryObjects[0].handle : 0;
    }
    objectFromZOrder(zOrder: number): number {
        const realZ = zOrder - 1;
        if (realZ < 0 || realZ >= this.primaryObjects.length) return 0;
        return this.primaryObjects[realZ].handle;
    }
    objectZOrder(hobject: number): number {
        for (let i = 0; i < this.primaryObjects.length; ++i) {
            if (this.primaryObjects[i].handle === hobject) return i + 1;
        }
        return 0;
    }
    lowerObjectHandle(hobject: number): number {
        const i = this.primaryObjects.findIndex((c) => c.handle === hobject);
        if (i < 1) return 0;
        return this.primaryObjects[i - 1].handle;
    }
    upperObjectHandle(hobject: number): number {
        const i = this.primaryObjects.findIndex((c) => c.handle === hobject);
        if (i < 0 || i >= this.primaryObjects.length - 1) return 0;
        return this.primaryObjects[i + 1].handle;
    }
    objectToTop(hobject: number): NumBool {
        const obj = this.primaryObjects.find((c) => c.handle === hobject);
        if (!obj) return 0;
        this.primaryObjects = [...this.primaryObjects.filter((c) => c !== obj), obj];
        this.dirty = true;
        return 1;
    }
    objectToBottom(hobject: number): NumBool {
        const obj = this.primaryObjects.find((c) => c.handle === hobject);
        if (!obj) return 0;
        this.primaryObjects = [obj, ...this.primaryObjects.filter((c) => c !== obj)];
        this.dirty = true;
        return 1;
    }
    swapObjects(hojb1: number, hojb2: number): NumBool {
        const i1 = this.primaryObjects.findIndex((c) => c.handle === hojb1);
        if (i1 < 0) return 0;
        const i2 = this.primaryObjects.findIndex((c) => c.handle === hojb2);
        if (i2 < 0) return 0;
        const c = this.primaryObjects[i1];
        this.primaryObjects[i1] = this.primaryObjects[i2];
        this.primaryObjects[i2] = c;
        this.dirty = true;
        return 1;
    }
    setObjectZOrder(hobject: number, zOrder: number): NumBool {
        const realZ = zOrder - 1;
        if (realZ < 0) return 0;
        const obj = this.primaryObjects.find((c) => c.handle === hobject);
        if (!obj) return 0;

        const res: typeof Scene.prototype["primaryObjects"] = [];
        for (let i = 0; i < this.primaryObjects.length; ++i) {
            if (i === realZ) res.push(obj);
            const cur = this.primaryObjects[i];
            if (cur !== obj) res.push(cur);
        }
        if (realZ >= this.primaryObjects.length) res.push(obj);
        this.primaryObjects = res;

        this.dirty = true;
        return 1;
    }

    objectName(hobject: number): string {
        return this.objects.get(hobject)?.name || "";
    }
    setObjectName(hobject: number, name: string): NumBool {
        const obj = this.objects.get(hobject);
        if (!obj) return 0;
        obj.name = name;
        return 1;
    }
    getObject2dByName(hgroup: number, name: string): number {
        if (name === "") return 0;
        if (hgroup) {
            const obj = this.objects.get(hgroup);
            return obj ? obj.getChildByName(name) : 0;
        }
        for (const obj of this.objects.values()) if (obj.name === name) return obj.handle;
        return 0;
    }

    private static _lastPrimary: number = 0;
    private getObjectInRealCoords(x: number, y: number, savePrimary = false): SceneObject | null {
        for (let i = this.primaryObjects.length - 1; i >= 0; --i) {
            const p = this.primaryObjects[i];
            const res = p.tryClick(x, y, this.layers);
            if (res) {
                if (savePrimary) Scene._lastPrimary = p.handle;
                return res;
            }
        }
        if (savePrimary) Scene._lastPrimary = 0;
        return null;
    }

    getObjectFromPoint2d(x: number, y: number, savePrimary = false): number {
        const mat = this.matrix;

        const w = x * mat[2] + y * mat[5] + mat[8];
        const realX = (x * mat[0] + y * mat[3] + mat[6]) / w;
        const realY = (x * mat[1] + y * mat[4] + mat[7]) / w;

        return this.getObjectInRealCoords(realX, realY, savePrimary)?.handle ?? 0;
    }

    static lastPrimary(): number {
        return Scene._lastPrimary;
    }

    isIntersect(hobj1: number, hobj2: number): NumBool {
        const o1 = this.objects.get(hobj1);
        if (!o1) return 0;
        const o2 = this.objects.get(hobj2);
        if (!o2) return 0;
        return o1.maxX() >= o2.minX() && o2.maxX() >= o1.minX() && o1.maxY() >= o2.minY() && o2.maxY() >= o1.minY() ? 1 : 0;
    }

    createPenTool(style: number, width: number, color: number, rop2: number): number {
        const handle = HandleMap.getFreeHandle(this.pens);
        this.pens.set(handle, new PenTool({ handle, color, width, rop2, style }));
        return handle;
    }
    createBrushTool(style: number, hatch: number, color: number, dibHandle: number, rop2: number): number {
        const handle = HandleMap.getFreeHandle(this.brushes);
        this.brushes.set(handle, new BrushTool(this, { handle, color, hatch, dibHandle, style, rop2 }));
        return handle;
    }
    createDIBTool(img: DibToolImage): number {
        const handle = HandleMap.getFreeHandle(this.dibs);
        this.dibs.set(handle, new DIBTool({ handle, type: "image", img }));
        return handle;
    }
    createDoubleDIBTool(img: DibToolImage): number {
        const handle = HandleMap.getFreeHandle(this.doubleDibs);
        this.doubleDibs.set(handle, new DIBTool({ handle, type: "image", img }));
        return handle;
    }
    createStringTool(text: string): number {
        const handle = HandleMap.getFreeHandle(this.strings);
        this.strings.set(handle, new StringTool({ handle, text }));
        return handle;
    }
    createFontTool(fontName: string, size: number, style: number): number {
        const handle = HandleMap.getFreeHandle(this.fonts);
        const italic = style & 1;
        const underline = style & 2;
        const strikeOut = style & 4;
        const weight = style & 8;
        this.fonts.set(handle, new FontTool({ handle, fontName, height: -size, italic, underline, strikeOut, weight }));
        return handle;
    }
    createTextTool(fontHandle: number, stringHandle: number, fgColor: number, bgColor: number): number {
        const handle = HandleMap.getFreeHandle(this.texts);
        this.texts.set(handle, new TextTool(this, { handle, textCollection: [{ fgColor, bgColor, fontHandle, stringHandle }] }));
        return handle;
    }

    private capture: EventSubscriber | null = null;
    setCapture(sub: EventSubscriber): void {
        this.capture = sub;
        Scene.captureTarget = this;
    }
    releaseCapture(): void {
        this.capture = null;
        Scene.captureTarget = null;
    }

    private sizeSubs = new Set<EventSubscriber>();
    private controlNotifySubs = new Map<EventSubscriber, number>();
    private moveSubs = new Map<EventSubscriber, number>();
    private leftButtonUpSubs = new Map<EventSubscriber, number>();
    private leftButtonDownSubs = new Map<EventSubscriber, number>();
    private rightButtonUpSubs = new Map<EventSubscriber, number>();
    private rightButtonDownSubs = new Map<EventSubscriber, number>();
    private middleButtonUpSubs = new Map<EventSubscriber, number>();
    private middleButtonDownSubs = new Map<EventSubscriber, number>();
    private keyDownSubs = new Set<EventSubscriber>();
    private keyUpSubs = new Set<EventSubscriber>();
    private keyCharSubs = new Set<EventSubscriber>();

    on(sub: EventSubscriber, code: Constant, objectHandle: number): void {
        switch (code) {
            case Constant.WM_SIZE:
                this.sizeSubs.add(sub);
                break;
            case Constant.WM_CONTROLNOTIFY:
                this.controlNotifySubs.set(sub, objectHandle);
                break;
            case Constant.WM_MOUSEMOVE:
                this.moveSubs.set(sub, objectHandle);
                break;
            case Constant.WM_LBUTTONDOWN:
                this.leftButtonDownSubs.set(sub, objectHandle);
                break;
            case Constant.WM_LBUTTONUP:
                this.leftButtonUpSubs.set(sub, objectHandle);
                break;
            // case EventCode.WM_LBUTTONDBLCLK:
            //     break;
            case Constant.WM_RBUTTONDOWN:
                this.rightButtonDownSubs.set(sub, objectHandle);
                break;
            case Constant.WM_RBUTTONUP:
                this.rightButtonUpSubs.set(sub, objectHandle);
                break;
            // case EventCode.WM_RBUTTONDBLCLK:
            //     break;
            case Constant.WM_MBUTTONDOWN:
                this.middleButtonDownSubs.set(sub, objectHandle);
                break;
            case Constant.WM_MBUTTONUP:
                this.middleButtonUpSubs.set(sub, objectHandle);
                break;
            // case EventCode.WM_MBUTTONDBLCLK:
            //     break;
            case Constant.WM_ALLMOUSEMESSAGE:
                this.moveSubs.set(sub, objectHandle);
                this.leftButtonDownSubs.set(sub, objectHandle);
                this.leftButtonUpSubs.set(sub, objectHandle);
                this.rightButtonDownSubs.set(sub, objectHandle);
                this.rightButtonUpSubs.set(sub, objectHandle);
                this.middleButtonDownSubs.set(sub, objectHandle);
                this.middleButtonUpSubs.set(sub, objectHandle);
                break;
            case Constant.WM_KEYDOWN:
                this.keyDownSubs.add(sub);
                break;
            case Constant.WM_KEYUP:
                this.keyUpSubs.add(sub);
                break;
            case 258: //WM_CHAR, видимо, забыли добавить в константы
                this.keyCharSubs.add(sub);
                break;
            case Constant.WM_ALLKEYMESSAGE:
                this.keyDownSubs.add(sub);
                this.keyUpSubs.add(sub);
                this.keyCharSubs.add(sub);
                break;
            default:
                console.warn(`Подписка на ${Constant[code]} не реализована (имидж: ${(sub as any).proto.name})`);
                // this._unsub.add(Constant[code]);
                // if (this._unsub.size > this._unsubS) {
                //     this._unsubS = this._unsub.size;
                //     console.warn(`Подписка на ${Constant[code]} не реализована (имидж: ${})`);
                // }
                break;
        }
    }
    // private _unsub = new Set<string>();
    // private _unsubS = 0;

    off(sub: EventSubscriber, code: Constant): void {
        switch (code) {
            case Constant.WM_SIZE:
                this.sizeSubs.delete(sub);
                break;
            case Constant.WM_CONTROLNOTIFY:
                this.controlNotifySubs.delete(sub);
                break;
            case Constant.WM_MOUSEMOVE:
                this.moveSubs.delete(sub);
                break;
            case Constant.WM_LBUTTONDOWN:
                this.leftButtonDownSubs.delete(sub);
                break;
            case Constant.WM_LBUTTONUP:
                this.leftButtonUpSubs.delete(sub);
                break;
            // case EventCode.WM_LBUTTONDBLCLK:
            //     break;
            case Constant.WM_RBUTTONDOWN:
                this.rightButtonDownSubs.delete(sub);
                break;
            case Constant.WM_RBUTTONUP:
                this.rightButtonUpSubs.delete(sub);
                break;
            // case EventCode.WM_RBUTTONDBLCLK:
            //     break;
            case Constant.WM_MBUTTONDOWN:
                this.middleButtonDownSubs.delete(sub);
                break;
            case Constant.WM_MBUTTONUP:
                this.middleButtonUpSubs.delete(sub);
                break;
            // case EventCode.WM_MBUTTONDBLCLK:
            //     break;
            case Constant.WM_ALLMOUSEMESSAGE:
                this.moveSubs.delete(sub);
                this.leftButtonDownSubs.delete(sub);
                this.leftButtonUpSubs.delete(sub);
                this.rightButtonDownSubs.delete(sub);
                this.rightButtonUpSubs.delete(sub);
                this.middleButtonDownSubs.delete(sub);
                this.middleButtonUpSubs.delete(sub);
                break;
            case Constant.WM_KEYDOWN:
                this.keyDownSubs.delete(sub);
                break;
            case Constant.WM_KEYUP:
                this.keyUpSubs.delete(sub);
                break;
            case 258: //WM_CHAR, видимо, забыли добавить в константы
                this.keyCharSubs.delete(sub);
                break;
            case Constant.WM_ALLKEYMESSAGE:
                this.keyDownSubs.delete(sub);
                this.keyUpSubs.delete(sub);
                this.keyCharSubs.delete(sub);
                break;
        }
    }

    setCursor(cursor: string): void {
        this.ctx.canvas.style.cursor = cursor;
    }

    private blocked = false;
    private overHyp = false;
    handleEvent(evt: PointerEvent): void {
        if (evt.type === "selectstart") {
            evt.preventDefault();
            return;
        }
        // Защита от дублирования сообщения.
        if (Scene.captureTarget === this && evt.currentTarget !== window) return;

        // Здесь можно было бы вызывать Scene.mouseCoords,
        // но там будут старые позиции - такая очередность событий.
        const rect = this.ctx.canvas.getBoundingClientRect();
        const clickX = (evt.clientX - rect.left) / this._scale;
        const clickY = (evt.clientY - rect.top) / this._scale;
        const x = clickX + this._originX;
        const y = clickY + this._originY;

        const lmb = evt.buttons & 1 ? 1 : 0;
        const rmb = evt.buttons & 2 ? 2 : 0;
        const wheel = evt.buttons & 4 ? 16 : 0;
        const fwkeys = lmb | rmb | wheel;

        Scene.keyState[1] = lmb;
        Scene.keyState[2] = rmb;
        Scene.keyState[4] = wheel;

        const curObj = this.getObjectInRealCoords(x, y);
        const objHandle = curObj?.handle ?? 0;
        const hyp = curObj?.hyperbase;
        if (hyp) {
            this.setCursor("pointer");
            this.overHyp = true;
        } else if (this.overHyp) {
            this.setCursor("default");
            this.overHyp = false;
        }

        switch (evt.type) {
            // https://developer.mozilla.org/ru/docs/Web/API/MouseEvent/button
            case "pointerdown": {
                Scene.kbdTarget = this;
                this.blocked = true;
                switch (evt.button) {
                    case 0: //Левая кнопка
                        this.hyperHandler?.click(hyp ?? null, { x: clickX, y: clickY });
                        this.dispatchMouseEvent(this.leftButtonDownSubs, objHandle, Constant.WM_LBUTTONDOWN, x, y, fwkeys);
                        return;
                    case 1: //Колесико
                        this.dispatchMouseEvent(this.middleButtonDownSubs, objHandle, Constant.WM_MBUTTONDOWN, x, y, fwkeys);
                        return;
                    case 2: //Правая кнопка
                        this.dispatchMouseEvent(this.rightButtonDownSubs, objHandle, Constant.WM_RBUTTONDOWN, x, y, fwkeys);
                        return;
                }
                return;
            }
            case "pointerup": {
                switch (evt.button) {
                    case 0:
                        this.dispatchMouseEvent(this.leftButtonUpSubs, objHandle, Constant.WM_LBUTTONUP, x, y, fwkeys);
                        return;
                    case 1:
                        this.dispatchMouseEvent(this.middleButtonUpSubs, objHandle, Constant.WM_MBUTTONUP, x, y, fwkeys);
                        return;
                    case 2:
                        this.dispatchMouseEvent(this.rightButtonUpSubs, objHandle, Constant.WM_RBUTTONUP, x, y, fwkeys);
                        return;
                }
                return;
            }
            // case "pointerleave": {
            //     this.dispatchMouseEvent(this.leftButtonUpSubs, objHandle, Constant.WM_LBUTTONUP, x, y, 0);
            //     return;
            // }
            case "pointermove":
                if (this.blocked) {
                    this.blocked = false;
                    return;
                }
                this.dispatchMouseEvent(this.moveSubs, objHandle, Constant.WM_MOUSEMOVE, x, y, fwkeys);
                return;
        }
    }

    private dispatchMouseEvent(subs: Map<EventSubscriber, number>, curObj: number, code: Constant, realX: number, realY: number, keys: number): void {
        const mat = this.invMatrix;

        const w = realX * mat[2] + realY * mat[5] + mat[8];
        const x = (realX * mat[0] + realY * mat[3] + mat[6]) / w;
        const y = (realX * mat[1] + realY * mat[4] + mat[7]) / w;

        for (const [sub, objHandle] of subs) {
            if (objHandle === 0 || objHandle === curObj || sub === this.capture) sub.receive(code, x, y, keys);
        }
    }

    private dispatchKeyboardEvent(evt: KeyboardEvent, rawKey: number): void {
        const repeat = 1;
        const scanCode = 0;
        if (evt.type === "keydown") {
            this.keyDownSubs.forEach((sub) => sub.receive(Constant.WM_KEYDOWN, rawKey, repeat, scanCode));
            //стрелки, Delete не отправляют WM_CHAR, т.к. не проходят TranslateMessage... Хер пойми как она работает.
            if ((rawKey > 36 && rawKey < 41) || rawKey === 46) return;

            const idx = win1251Table.indexOf(evt.key);
            const translatedKey = idx < 0 ? rawKey : idx;
            this.keyCharSubs.forEach((sub) => sub.receive(258, translatedKey, repeat, scanCode)); //258 - WM_CHAR, нет в константах.
        } else {
            this.keyUpSubs.forEach((sub) => sub.receive(Constant.WM_KEYUP, rawKey, repeat, scanCode));
        }
    }

    dispatchControlNotifyEvent(ctrlHandle: number, evt: Event): void {
        let notifyCode = 0;
        switch (evt.type) {
            case "input":
                notifyCode = 768;
                break;
            case "focus":
                Scene.kbdTarget = null;
                return;
            default:
                return;
        }
        for (const [sub, objHandle] of this.controlNotifySubs) {
            if (objHandle === 0 || objHandle === ctrlHandle) sub.receive(Constant.WM_CONTROLNOTIFY, ctrlHandle, 0, notifyCode);
        }
    }

    beforeRemove(): void {
        if (Scene.kbdTarget === this) Scene.kbdTarget = null;
        if (Scene.captureTarget === this) Scene.captureTarget = null;
    }
}

window.addEventListener("pointerdown", Scene.handlePointer);
window.addEventListener("pointermove", Scene.handlePointer);
window.addEventListener("pointerup", Scene.handlePointer);
window.addEventListener("keydown", Scene.handleKeyboard);
window.addEventListener("keyup", Scene.handleKeyboard);
