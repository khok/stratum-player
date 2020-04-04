declare module "vm-interfaces-graphics" {
    import {
        BitmapElementData,
        BitmapToolData,
        BrushToolData,
        ControlElementData,
        DoubleBitmapElementData,
        DoubleBitmapToolData,
        FontToolData,
        GroupElementData,
        LineElementData,
        PenToolData,
        Point2D,
        StringColor,
        StringToolData,
        TextElementData,
        TextToolData,
    } from "data-types-graphics";
    import { ClassState, VmBool } from "vm-interfaces-base";
    import { VmStateContainer } from "vm-types";

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
        fillType: "SOLID" | "NULL" | "PATTERN" | "HATCED";
        bmpTool?: BitmapToolState;
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
        readonly name: string;
        readonly size: number;
        readonly style: number;
    }
    export interface StringToolState {
        readonly handle: number;
        readonly type: StringToolData["type"];
        text: string;
    }

    export interface TextFragment {
        font: FontToolState;
        stringFragment: StringToolState;
        foregroundColor: StringColor;
        backgroundColor: StringColor;
    }

    export interface TextToolState {
        readonly handle: number;
        readonly type: TextToolData["type"];
        readonly textCount: number;
        getFragment(index: number): TextFragment;
        updateString(str: StringToolState, idx: number): void;
        updateFont(font: FontToolState, idx: number): void;
        updateFgColor(color: StringColor, idx: number): void;
        updateBgColor(color: StringColor, idx: number): void;
        readonly assembledText: { text: string; size: number };
    }

    export type ToolState =
        | PenToolState
        | BrushToolState
        | BitmapToolState
        | DoubleBitmapToolState
        | FontToolState
        | StringToolState
        | TextToolState;

    export interface GraphicSpaceToolsState {
        createBitmap(bmpFilename: string): BitmapToolState;
        createPen(width: number, color: StringColor): PenToolState;
        createFont(fontName: string, size: number, style: number): FontToolState;
        createString(value: string): StringToolState;
        createText(
            font: FontToolState,
            stringFragment: StringToolState,
            foregroundColor: StringColor,
            backgroundColor: StringColor
        ): TextToolState;
        getTool<T extends ToolState>(type: T["type"], handle: number): T | undefined;
        deleteTool<T extends ToolState>(type: T["type"], handle: number): VmBool;
    }

    export interface GraphicObjectStateBase {
        readonly handle: number;
        readonly parent: GroupObjectState | undefined;
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
        getPoint(index: number): Point2D;
        setPointPosition(index: number, x: number, y: number): VmBool;
    }
    export interface ControlObjectState extends GraphicObjectStateBase {
        readonly type: ControlElementData["type"];
        text: string;
    }
    export interface TextObjectState extends GraphicObjectStateBase {
        readonly type: TextElementData["type"];
        text: TextToolState;
    }
    interface _BmpBase extends GraphicObjectStateBase {
        setRect(x: number, y: number, width: number, height: number): VmBool;
    }
    export interface BitmapObjectState extends _BmpBase {
        readonly type: BitmapElementData["type"];
        bmpTool: BitmapToolState | undefined;
        setRect(x: number, y: number, width: number, height: number): VmBool;
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
        | TextObjectState
        | BitmapObjectState
        | DoubleBitmapObjectState
        | GroupObjectState;

    export interface GraphicSpaceState {
        readonly handle: number;
        readonly tools: GraphicSpaceToolsState;
        readonly originX: number;
        readonly originY: number;
        readonly sourceFilename: string;
        setOrigin(x: number, y: number): VmBool;

        createText(x: number, y: number, angle: number, textHandle: number): TextObjectState;
        createBitmap(x: number, y: number, bitmapToolHandle: number): BitmapObjectState;
        createLine(points: Point2D[], penHandle: number, brushHandle: number): LineObjectState;
        createGroup(objectHandles: number[]): GroupObjectState | undefined;
        getObject(handle: number): GraphicObjectState | undefined;
        deleteObject(handle: number): VmBool;

        subscribe(ctx: VmStateContainer, klass: ClassState, msg: number, objectHandle: number, flags: number): void;

        findObjectByName(objectName: string, group?: GroupObjectState): GraphicObjectState | undefined;
        getObjectFromPoint(x: number, y: number): GraphicObjectState | undefined;
        isIntersect(obj: GraphicObjectState, obj2: GraphicObjectState): VmBool;
    }
}
