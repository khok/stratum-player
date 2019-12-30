import { fabric } from "fabric";
import { Point2D } from "data-types-graphics";
import {
    BitmapElementVisual,
    BitmapVisualOptions,
    ControlElementVisual,
    ControlVisualOptions,
    DoubleBitmapElementVisual,
    DoubleBitmapVisualOptions,
    LineElementVisual,
    LineVisualOptions,
    Scene
} from "scene-types";
import { StratumError } from "~/helpers/errors";
import { HandleMap } from "~/helpers/handleMap";
import { FabricLine } from "./components/fabricLine";
import { FabricBitmap } from "./components/fabricBitmap";
import { FabricDoubleBitmap } from "./components/fabricDoubleBitmap";
import { fabricConfigCanvasOptions } from "./fabricConfig";

type VisualObject = FabricLine | FabricBitmap | FabricDoubleBitmap;

export class FabricScene implements Scene {
    private canvas: fabric.StaticCanvas;
    private objects: HandleMap<VisualObject> = HandleMap.create();
    private objectsByZReversed: VisualObject[] = [];
    private view: Point2D;
    private _redraw = false;
    constructor({ canvas, view }: { canvas: HTMLCanvasElement; view: Point2D }) {
        this.canvas = new fabric.StaticCanvas(canvas, {
            ...fabricConfigCanvasOptions,
            preserveObjectStacking: true,
            renderOnAddRemove: false
        });
        this.view = { ...view };
    }
    requestRedraw() {
        this._redraw = true;
    }
    placeObjects(order: number[]): void {
        const objsByZ = [];
        for (const handle of order) {
            const obj = this.objects.get(handle);
            if (!obj) throw new StratumError(`Объект #${handle} не найден на сцене`);
            this.canvas.add(obj.obj);
            objsByZ.push(obj);
        }
        this.objectsByZReversed = objsByZ.reverse();
        this.requestRedraw();
    }
    translateView(x: number, y: number): void {
        this.view.x = x;
        this.view.y = y;
        for (const obj of this.objects.values()) obj.updateAfterViewTranslate();
        this.requestRedraw();
    }
    getVisualHandleFromPoint(x: number, y: number): number {
        for (const obj of this.objectsByZReversed) {
            if (obj.selectable && obj.testIntersect(x, y)) return obj.handle;
        }
        return 0;
    }
    render() {
        if (this._redraw) this.forceRender();
    }

    forceRender() {
        this.canvas.renderAll();
        this._redraw = false;
    }

    assertNoObject(handle: number) {
        if (this.objects.has(handle)) throw new StratumError(`Объект #${handle} уже существует на сцене`);
    }
    createLine(data: LineVisualOptions): LineElementVisual {
        this.assertNoObject(data.handle);
        const obj = new FabricLine(data, this.view, () => this.requestRedraw(), this.canvas.remove);
        this.objects.set(data.handle, obj);
        return obj;
    }
    createControl(data: ControlVisualOptions): ControlElementVisual {
        throw new Error("Method not implemented.");
    }
    createBitmap(data: BitmapVisualOptions): BitmapElementVisual {
        this.assertNoObject(data.handle);
        const obj = new FabricBitmap(data, this.view, () => this.requestRedraw(), this.canvas.remove);
        this.objects.set(data.handle, obj);
        return obj;
    }
    createDoubleBitmap(data: DoubleBitmapVisualOptions): DoubleBitmapElementVisual {
        this.assertNoObject(data.handle);
        const obj = new FabricDoubleBitmap(data, this.view, () => this.requestRedraw(), this.canvas.remove);
        this.objects.set(data.handle, obj);
        return obj;
    }
}
