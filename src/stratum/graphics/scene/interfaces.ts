import { ControlElement } from "stratum/fileFormats/vdr";
import { Point2D } from "stratum/helpers/types";
import { SceneBmpTool, SceneBrushTool, ScenePenTool, SceneTextTool } from "./tools";

interface _RenderableBase {
    setPosition(x: number, y: number): void;
    scaleTo(width: number, height: number): void;
    setAngle(angle: number): void;
    show(): void;
    hide(): void;
    getVisibleAreaSize(): Point2D;
}

export interface RenderableLine extends _RenderableBase {
    updatePen(pen: ScenePenTool): void;
    updateBrush(brush: SceneBrushTool): void;
    setPointPosition(index: number, x: number, y: number): void;
    addPoint(index: number, x: number, y: number): void;
}

export interface RenderableText extends _RenderableBase {
    updateTextTool(text: SceneTextTool): void;
}

export interface RenderableBitmap extends _RenderableBase {
    updateBitmap(bmp: SceneBmpTool): void;
    setRect(x: number, y: number, width: number, height: number): void;
}

export interface RenderableControl extends _RenderableBase {
    setText(text: string): void;
    getText(): string;
}

export type RenderableElement = RenderableLine | RenderableText | RenderableBitmap | RenderableControl;

interface RenderableParams {
    handle: number;
    position: Point2D;
    isVisible: boolean;
    selectable: boolean;
}

export interface RenderableLineParams extends RenderableParams {
    points: Point2D[];
    pen?: ScenePenTool;
    brush?: SceneBrushTool;
    arrows?: unknown;
}

export interface RenderableTextParams extends RenderableParams {
    textTool: SceneTextTool;
    angle?: number;
}

export interface RenderableBmpParams extends RenderableParams {
    bmpTool: SceneBmpTool;
    bmpSize: Point2D;
    scale?: Point2D;
    bmpOrigin?: Point2D;
}

export interface RenderableControlParams extends RenderableParams {
    classname: ControlElement["classname"];
    controlSize: Point2D;
    text?: string;
}

export interface RenderableFactory {
    createLine(params: RenderableLineParams): RenderableLine;
    createText(params: RenderableTextParams): RenderableText;
    createBitmap(params: RenderableBmpParams): RenderableBitmap;
    createControl(params: RenderableControlParams): RenderableControl;
}

export interface Renderer extends RenderableFactory {
    updateBrush(brush: SceneBrushTool): void;

    //Управление порядком отображения объектов.
    /**
     * Размещает объекты на сцене согласно указанном порядку `order`.
     * @param order - массив дескрипторов объектов, от дальнего к ближнему
     */
    placeObjects(order: number[]): void;
    /** Добавляет объект с дескриптором `handle` на сцену поверх остальных. */
    appendObjectToEnd(visual: RenderableElement): void;
    moveObjectToTop(visual: RenderableElement): void;
    moveObjectRangeToTop(visual: RenderableElement[]): void;
    removeObject(visual: RenderableElement): void;

    //изменение точки обзора, размеров сцены
    setView(x: number, y: number): void;

    //визуальные проверки
    getVisualHandleFromPoint(x: number, y: number): number;
    /** Проверяет, находится ли точка (`x`; `y`) в пределах области объекта */
    testVisualIntersection(visualHandle: number, x: number, y: number): boolean;
}

export interface InputEventReceiver {
    handleEvent(data: { x: number; y: number; buttons: number; button: number }, type: "down" | "up" | "move"): void;
    //подписки на события от пользователя (клик мышью, изменение html текстбоксов)
    subscribeToMouseEvents(callback: (code: number, buttons: number, x: number, y: number) => void): void;
    subscribeToControlEvents(callback: (code: number, controlHandle: number) => void): void;
}
