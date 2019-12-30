declare module "scene-types" {
    import { ControlElementData, Point2D } from "data-types-graphics";
    import { BitmapToolState, BrushToolState, PenToolState, DoubleBitmapToolState } from "vm-interfaces-graphics";

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

    export interface ControlElementVisual extends _VisualBase {
        setText(text: string): void;
    }

    export interface BitmapElementVisual extends _VisualBase {
        updateBitmap(bmp: BitmapToolState): void;
    }

    export interface DoubleBitmapElementVisual extends _VisualBase {
        updateBitmap(bmp: DoubleBitmapToolState): void;
    }

    export type Visual2D = LineElementVisual | ControlElementVisual | BitmapElementVisual | DoubleBitmapElementVisual;

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

    export interface ControlVisualOptions extends VisualOptions {
        classname: ControlElementData["classname"];
        text: string;
    }

    export interface BitmapVisualOptions extends VisualOptions {
        bmpOrigin: Point2D;
        bmpiSize: Point2D;
        bitmapTool: BitmapToolState;
    }

    export interface DoubleBitmapVisualOptions extends VisualOptions {
        bmpOrigin: Point2D;
        bmpiSize: Point2D;
        doubleBitmapTool: DoubleBitmapToolState;
    }

    export interface VisualFactory {
        createLine(data: LineVisualOptions): LineElementVisual;
        createControl(data: ControlVisualOptions): ControlElementVisual;
        createBitmap(data: BitmapVisualOptions): BitmapElementVisual;
        createDoubleBitmap(data: DoubleBitmapVisualOptions): DoubleBitmapElementVisual;
    }

    export interface Scene extends VisualFactory {
        placeObjects(order: number[]): void;
        translateView(x: number, y: number): void;
        getVisualHandleFromPoint(x: number, y: number): number;
        render(): void;
        forceRender(): void;
    }
}
