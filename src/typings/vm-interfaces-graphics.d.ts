declare module "vm-interfaces-graphics" {
    import { VmBool } from "vm-interfaces-base";
    import {
        ElementData,
        LineElementData,
        ControlElementData,
        GroupElementData,
        ExternalBitmapToolData,
        BitmapToolData,
        DoubleBitmapToolData,
        Element2dData,
        StringColor,
        PenToolData,
        BrushToolData,
        FontToolData,
        TextToolData,
        BitmapElementData,
        DoubleBitmapElementData
    } from "data-types-graphics";

    export interface PenToolState {
        readonly handle: number;
        readonly type: PenToolData["type"];
        color: StringColor;
        width: number;
    }

    export interface BrushToolState {
        readonly handle: number;
        readonly type: BrushToolData["type"];
        color: StringColor;
    }
    export interface ExternalBitmapToolState {
        readonly handle: number;
        readonly type: ExternalBitmapToolData["type"];
    }
    export interface BitmapToolState {
        readonly handle: number;
        readonly type: BitmapToolData["type"];
        image: HTMLImageElement;
        setPixel(x: number, y: number, color: StringColor): VmBool;
        getPixel(x: number, y: number): StringColor;
    }
    export interface DoubleBitmapToolState {
        readonly handle: number;
        readonly type: DoubleBitmapToolData["type"];
        image: HTMLImageElement;
    }
    export interface FontToolState {
        readonly handle: number;
        readonly type: FontToolData["type"];
    }
    export interface TextDataToolState {
        readonly handle: number;
        readonly type: TextToolData["type"];
    }

    export type ToolState =
        | PenToolState
        | BrushToolState
        | BitmapToolState
        | DoubleBitmapToolState
        | FontToolState
        | TextDataToolState;

    export interface GraphicSpaceToolsState {
        addTool(handle: number, tool: ToolState): void;
        getTool<T extends ToolState>(type: T["type"], handle: number): T | undefined;
        deleteTool<T extends ToolState>(type: T["type"], handle: number): VmBool;
    }

    export interface GraphicObjectStateBase {
        readonly handle: number;
        parent: GroupObjectState | undefined;
        name: string;

        readonly positionX: number;
        readonly positionY: number;
        setPosition(x: number, y: number): VmBool;

        readonly angle: number;
        rotate(centerX: number, centerY: number, angleRad: number): VmBool;

        readonly width: number;
        readonly height: number;
        setSize(width: number, height: number): VmBool;

        zOrder: number;
        isVisible: VmBool;
    }

    export interface LineObjectState extends GraphicObjectStateBase {
        readonly type: LineElementData["type"];
        pen: PenToolState | undefined;
        brush: BrushToolState | undefined;
    }
    export interface ControlObjectState extends GraphicObjectStateBase {
        readonly type: ControlElementData["type"];
        text: string;
    }
    interface _BmpBase extends GraphicObjectStateBase {
        setRect(x: number, y: number, width: number, height: number): VmBool;
    }
    export interface BitmapObjectState extends _BmpBase {
        readonly type: BitmapElementData["type"];
        bmpTool: BitmapToolState | undefined;
        //TODO:
        // открыть доки стратума и почитать про функции двойной и одиночной битовой карты, реализовать их.
        //затем сделать соответственно элемент, его визуал и тулзу
        //ENDSHERE
    }
    export interface DoubleBitmapObjectState extends _BmpBase {
        readonly type: DoubleBitmapElementData["type"];
        doubleBitmapTool: DoubleBitmapToolState | undefined;
    }
    export interface GroupObjectState extends GraphicObjectStateBase {
        readonly type: GroupElementData["type"];
        readonly items: IterableIterator<GraphicObjectState>;
        hasItem(obj: GraphicObjectStateBase): VmBool;
        addItem(obj: GraphicObjectState): VmBool;
        removeItem(obj: GraphicObjectStateBase): VmBool;
        removeAll(): VmBool;
    }

    export type GraphicObjectState =
        | LineObjectState
        | ControlObjectState
        | BitmapObjectState
        | DoubleBitmapObjectState
        | GroupObjectState;

    export interface GraphicSpaceState {
        readonly handle: number;
        readonly tools: GraphicSpaceToolsState;
        readonly originX: number;
        readonly originY: number;
        setOrigin(x: number, y: number): VmBool;

        // createTool(type: "pen" | "brush" | "bitmap"): number;
        // createObject(type: never): number;
        // readonly scale: number;
        // setScale(scale: number): VmBool;
        // addPenTool(handle: number, pen: PenToolState): void;
        // getPenTool(handle: number): PenToolState | undefined;
        // deletePenTool(handle: number): VmBool;

        // addBrushTool(handle: number, brush: BrushToolState): void;
        // getBrushTool(handle: number): BrushToolState | undefined;
        // deleteBrushTool(handle: number): VmBool;

        // addBitmapTool(handle: number, bmp: BitmapToolState | ExternalBitmapToolState): void;
        // getBitmapTool(handle: number): BitmapToolState | ExternalBitmapToolState;
        // deleteBitmapTool(handle: number): VmBool;

        // addDoubleBitmapTool(handle: number, bmp: DoubleBitmapToolState | ExternalBitmapToolState): void;
        // getDoubleBitmapTool(handle: number): DoubleBitmapToolState | ExternalBitmapToolState;
        // deleteDoubleBitmapTool(handle: number): VmBool;

        addObject(obj: GraphicObjectState): number;
        getObject(handle: number): GraphicObjectState | undefined;
        deleteObject(handle: number): VmBool;

        findObjectByName(objectName: string, group?: GroupObjectState): GraphicObjectState | undefined;
        getObjectFromPoint(x: number, y: number): GraphicObjectState | undefined;
        getObjectHandleFromPoint(x: number, y: number): number;
    }
}
