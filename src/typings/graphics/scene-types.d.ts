declare module "scene-types" {
    import { ControlElementData, Point2D, VdrLayers } from "data-types-graphics";
    import { BitmapToolState, BrushToolState, PenToolState, TextToolState } from "vm-interfaces-graphics";

    interface _VisualBase {
        setPosition(x: number, y: number): void;
        setAngle(angle: number): void;
        show(): void;
        hide(): void;
        applyLayers(layers: VdrLayers): void;
    }

    export interface LineElementVisual extends _VisualBase {
        setPoints(points: Point2D[]): void;
        updatePen(pen: PenToolState): void;
        updateBrush(brush: BrushToolState): void;
        getVisibleAreaSize(): Point2D;
    }

    export interface TextElementVisual extends _VisualBase {
        updateText(text: TextToolState): void;
        getVisibleAreaSize(): Point2D;
    }

    export interface ControlElementVisual extends _VisualBase {
        setText(text: string): void;
        getText(): string;
    }

    export interface BitmapElementVisual extends _VisualBase {
        setRect(x: number, y: number, width: number, height: number): void;
        updateBitmap(bmp: BitmapToolState): void;
    }

    export type Visual2D = LineElementVisual | ControlElementVisual | TextElementVisual | BitmapElementVisual;

    export interface VisualOptions {
        handle: number;
        position: Point2D;
        size: Point2D;
        isVisible: boolean;
        selectable: boolean;
    }

    export interface LineVisualOptions extends VisualOptions {
        points: Point2D[];
        pen?: PenToolState;
        brush?: BrushToolState;
        arrows?: unknown;
        options: number;
    }

    export interface TextVisualOptions extends VisualOptions {
        textTool: TextToolState;
        angle: number;
    }

    export interface ControlVisualOptions extends VisualOptions {
        classname: ControlElementData["classname"];
        text: string;
        controlSize: Point2D;
    }

    export interface BitmapVisualOptions extends VisualOptions {
        bmpOrigin: Point2D;
        bmpSize: Point2D;
        bitmapTool: BitmapToolState;
    }

    export interface VisualFactory {
        createLine(data: LineVisualOptions): LineElementVisual;
        createControl(data: ControlVisualOptions): ControlElementVisual;
        createText(data: TextVisualOptions): TextElementVisual;
        createBitmap(data: BitmapVisualOptions): BitmapElementVisual;
    }

    export interface Scene extends VisualFactory {
        moveObjectToTop(handle: number): void;
        applyLayers(layers: VdrLayers): void;
        adaptToNewSize(width: number, height: number): void;
        updateBrush(brush: BrushToolState): void;
        /**
         * Размещает объекты на сцене согласно указанном порядку `order`
         * @param order - массив дескрипторов объектов, от дальнего к ближнему
         */
        placeObjects(order: number[]): void;
        appendLastObject(handle: number): void;
        removeObject(visual: Visual2D): void;
        translateView(x: number, y: number): void;
        getVisualHandleFromPoint(x: number, y: number): number;
        testVisualIntersection(visualHandle: number, x: number, y: number): boolean;
        subscribeToMouseEvents(callback: (code: number, x: number, y: number) => void): void;
        subscribeToControlEvents(callback: (code: number, controlHandle: number) => void): void;
        render(): boolean;
        forceRender(): void;
    }
}
