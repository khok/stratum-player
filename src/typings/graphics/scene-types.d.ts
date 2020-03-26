declare module "scene-types" {
    import { ControlElementData, Point2D } from "data-types-graphics";
    import {
        BitmapToolState,
        BrushToolState,
        PenToolState,
        DoubleBitmapToolState,
        TextToolState
    } from "vm-interfaces-graphics";

    interface _VisualBase {
        setPosition(x: number, y: number): void;
        setAngle(angle: number): void;
        show(): void;
        hide(): void;
        destroy(): void;
    }

    export interface LineElementVisual extends _VisualBase {
        setPoints(points: Point2D[]): void;
        updatePen(pen: PenToolState): void;
        updateBrush(brush: BrushToolState): void;
    }

    export interface TextElementVisual extends _VisualBase {
        updateText(text: TextToolState): void;
    }

    export interface ControlElementVisual extends _VisualBase {
        setText(text: string): void;
        getText(): string;
    }

    export interface BitmapElementVisual extends _VisualBase {
        setRect(x: number, y: number, width: number, height: number): void;
        updateBitmap(bmp: BitmapToolState): void;
    }

    export interface DoubleBitmapElementVisual extends _VisualBase {
        updateBitmap(bmp: DoubleBitmapToolState): void;
    }

    export type Visual2D =
        | LineElementVisual
        | ControlElementVisual
        | TextElementVisual
        | BitmapElementVisual
        | DoubleBitmapElementVisual;

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
    }

    export interface TextVisualOptions extends VisualOptions {
        text: TextToolState;
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

    export interface DoubleBitmapVisualOptions extends VisualOptions {
        bmpOrigin: Point2D;
        bmpSize: Point2D;
        doubleBitmapTool: DoubleBitmapToolState;
    }

    export interface VisualFactory {
        createLine(data: LineVisualOptions): LineElementVisual;
        createControl(data: ControlVisualOptions): ControlElementVisual;
        createText(data: TextVisualOptions): TextElementVisual;
        createBitmap(data: BitmapVisualOptions): BitmapElementVisual;
        createDoubleBitmap(data: DoubleBitmapVisualOptions): DoubleBitmapElementVisual;
    }

    export interface Scene extends VisualFactory {
        adaptToNewSize(width: number, height: number): void;
        updateBrush(brush: BrushToolState): void;
        placeObjects(order: number[]): void;
        appendLastObject(handle: number): void;
        translateView(x: number, y: number): void;
        getVisualHandleFromPoint(x: number, y: number): number;
        testVisualIntersection(visualHandle: number, x: number, y: number): boolean;
        subscribeToMouseEvents(callback: (code: number, x: number, y: number) => void): void;
        subscribeToControlEvents(callback: (code: number, controlHandle: number) => void): void;
        render(): boolean;
        forceRender(): void;
    }
}
