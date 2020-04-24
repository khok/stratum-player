declare module "scene-types" {
    import { ControlElementData, Point2D } from "vdr-types";
    import { BitmapToolState, BrushToolState, PenToolState, TextToolState } from "vm-interfaces-gspace";

    interface _VisualBase {
        setPosition(x: number, y: number): void;
        scaleTo(width: number, height: number): void;
        setAngle(angle: number): void;
        show(): void;
        hide(): void;
        getVisibleAreaSize(): Point2D;
    }

    export interface LineElementVisual extends _VisualBase {
        updatePen(pen: PenToolState): void;
        updateBrush(brush: BrushToolState): void;
        setPointPosition(index: number, x: number, y: number): void;
        addPoint(index: number, x: number, y: number): void;
    }

    export interface TextElementVisual extends _VisualBase {
        updateTextTool(text: TextToolState): void;
    }

    export interface BitmapElementVisual extends _VisualBase {
        updateBitmap(bmp: BitmapToolState): void;
        setRect(x: number, y: number, width: number, height: number): void;
    }

    export interface ControlElementVisual extends _VisualBase {
        setText(text: string): void;
        getText(): string;
    }

    export type Visual2D = LineElementVisual | TextElementVisual | BitmapElementVisual | ControlElementVisual;

    export interface VisualOptions {
        handle: number;
        position: Point2D;
        isVisible: boolean;
        selectable: boolean;
    }

    export interface LineVisualOptions extends VisualOptions {
        points: Point2D[];
        pen?: PenToolState;
        brush?: BrushToolState;
        arrows?: unknown;
    }

    export interface TextVisualOptions extends VisualOptions {
        textTool: TextToolState;
        angle?: number;
    }

    export interface BitmapVisualOptions extends VisualOptions {
        bmpTool: BitmapToolState;
        bmpSize: Point2D;
        scale?: Point2D;
        bmpOrigin?: Point2D;
    }

    export interface ControlVisualOptions extends VisualOptions {
        classname: ControlElementData["classname"];
        controlSize: Point2D;
        text?: string;
    }

    export interface VisualFactory {
        createLine(data: LineVisualOptions): LineElementVisual;
        createText(data: TextVisualOptions): TextElementVisual;
        createBitmap(data: BitmapVisualOptions): BitmapElementVisual;
        createControl(data: ControlVisualOptions): ControlElementVisual;
    }

    export interface Scene extends VisualFactory {
        updateBrush(brush: BrushToolState): void;

        //Управление порядком отображения объектов.
        /**
         * Размещает объекты на сцене согласно указанном порядку `order`.
         * @param order - массив дескрипторов объектов, от дальнего к ближнему
         */
        placeObjects(order: number[]): void;
        /** Добавляет объект с дескриптором `handle` на сцену поверх остальных. */
        appendObjectToEnd(visual: Visual2D): void;
        moveObjectToTop(visual: Visual2D): void;
        moveObjectRangeToTop(visual: Visual2D[]): void;
        removeObject(visual: Visual2D): void;

        //изменение точки обзора, размеров сцены
        translateView(x: number, y: number): void;
        adaptToNewSize(width: number, height: number): void;

        //визуальные проверки
        getVisualHandleFromPoint(x: number, y: number): number;
        /** Проверяет, находится ли точка (`x`; `y`) в пределах области объекта */
        testVisualIntersection(visualHandle: number, x: number, y: number): boolean;

        //запуск отрисовки
        render(): boolean;

        //подписки на события от пользователя (клик мышью, изменение html текстбоксов)
        subscribeToMouseEvents(callback: (code: number, buttons: number, x: number, y: number) => void): void;
        subscribeToControlEvents(callback: (code: number, controlHandle: number) => void): void;
    }
}
