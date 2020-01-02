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
    Scene,
    TextVisualOptions,
    TextElementVisual
} from "scene-types";
import { StratumError } from "~/helpers/errors";
import { HandleMap } from "~/helpers/handleMap";
import { FabricLine } from "./components/fabricLine";
import { FabricBitmap } from "./components/fabricBitmap";
import { FabricDoubleBitmap } from "./components/fabricDoubleBitmap";
import { fabricConfigCanvasOptions } from "./fabricConfig";
import { FabricText } from "./components/fabricText";
import { BrushToolState } from "vm-interfaces-graphics";
import { FabricControl } from "./components/fabricControl";

type VisualObject = FabricLine | FabricBitmap | FabricDoubleBitmap | FabricText | FabricControl;

export class FabricScene implements Scene {
    private canvas: fabric.StaticCanvas;
    private hiddenInput?: HTMLInputElement;
    private objects: HandleMap<VisualObject> = HandleMap.create();
    private controls: FabricControl[] = [];
    private focusedControl?: FabricControl;
    private objectsByZReversed: VisualObject[] = [];
    private view: Point2D;
    private _redraw = false;
    constructor({
        canvas,
        hiddenInput,
        view
    }: {
        canvas: HTMLCanvasElement;
        hiddenInput?: HTMLInputElement;
        view: Point2D;
    }) {
        if (hiddenInput) {
            this.hiddenInput = hiddenInput;
            hiddenInput.addEventListener(
                "input",
                () => {
                    if (!this.focusedControl) return;
                    this.focusedControl.setText(hiddenInput.value);
                    this.render();
                },
                false
            );
            hiddenInput.addEventListener("blur", () => {
                if (!this.focusedControl) return;
                this.focusedControl.blur();
                this.focusedControl = undefined;
                this.render();
            });
        }
        const callback = (e: MouseEvent, click: boolean) => {
            const x = e.pageX - canvas.offsetLeft + this.view.x;
            const y = e.pageY - canvas.offsetTop + this.view.y;
            if (click) this.tryControlClick(x, y);
            else this.tryControlHover(x, y);
        };
        canvas.addEventListener("mousemove", e => callback(e, false));
        canvas.addEventListener("click", e => callback(e, true));
        this.canvas = new fabric.StaticCanvas(canvas, {
            ...fabricConfigCanvasOptions,
            preserveObjectStacking: true,
            renderOnAddRemove: false
        });
        this.view = { ...view };
    }
    updateBrush(brush: BrushToolState) {
        this.canvas.backgroundColor = brush.color;
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

    get hiddenInputExist() {
        return (
            this.hiddenInput && this.hiddenInput.tagName.toLowerCase() === "input" && this.hiddenInput.type === "text"
        );
    }

    tryControlClick(x: number, y: number) {
        if (!this.hiddenInputExist) return;
        const cnv = this.canvas.getElement();
        for (const ctrl of this.controls) {
            if (!ctrl.testIntersect(x, y)) continue;
            this.hiddenInput!.focus();
            if (this.focusedControl === ctrl) return;
            if (this.focusedControl) this.focusedControl.blur();
            this.focusedControl = ctrl;
            ctrl.focus();
            this.hiddenInput!.value = ctrl.getText();
            this.render();
            return;
        }
        // if (this.focusedControl) {
        // this.hiddenInput!.blur();
        // }
    }

    tryControlHover(x: number, y: number) {
        if (!this.hiddenInputExist) return;
        const cnv = this.canvas.getElement();
        for (const ctrl of this.controls) {
            if (!ctrl.testIntersect(x, y)) continue;
            if (cnv.style.cursor !== "text") cnv.style.setProperty("cursor", "text");
            return;
        }
        if (cnv.style.cursor !== "default") cnv.style.setProperty("cursor", "default");
    }

    getVisualHandleFromPoint(x: number, y: number): number {
        for (const obj of this.objectsByZReversed) {
            if (obj.selectable && obj.testIntersect(x, y)) return obj.type !== "control" ? obj.handle : 0;
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
        const obj = new FabricLine(
            data,
            this.view,
            () => this.requestRedraw(),
            o => this.canvas.remove(o)
        );
        this.objects.set(data.handle, obj);
        return obj;
    }
    createControl(data: ControlVisualOptions): ControlElementVisual {
        if (!this.hiddenInputExist)
            throw new StratumError("Попытка создать элемент управления без заглушки типа 'text'");
        this.assertNoObject(data.handle);
        const obj = new FabricControl(
            data,
            this.view,
            () => this.requestRedraw(),
            o => this.canvas.remove(o)
        );
        this.objects.set(data.handle, obj);
        this.controls.push(obj);
        return obj;
    }
    createText(data: TextVisualOptions): TextElementVisual {
        this.assertNoObject(data.handle);
        const obj = new FabricText(
            data,
            this.view,
            () => this.requestRedraw(),
            o => this.canvas.remove(o)
        );
        this.objects.set(data.handle, obj);
        return obj;
    }
    createBitmap(data: BitmapVisualOptions): BitmapElementVisual {
        this.assertNoObject(data.handle);
        const obj = new FabricBitmap(
            data,
            this.view,
            () => this.requestRedraw(),
            o => this.canvas.remove(o)
        );
        this.objects.set(data.handle, obj);
        return obj;
    }
    createDoubleBitmap(data: DoubleBitmapVisualOptions): DoubleBitmapElementVisual {
        this.assertNoObject(data.handle);
        const obj = new FabricDoubleBitmap(
            data,
            this.view,
            () => this.requestRedraw(),
            o => this.canvas.remove(o)
        );
        this.objects.set(data.handle, obj);
        return obj;
    }
}
