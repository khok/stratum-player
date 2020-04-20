declare module "vm-interfaces-graphics" {
    import {
        BitmapElementData,
        ControlElementData,
        GroupElementData,
        LineElementData,
        Point2D,
        StringColor,
        TextElementData,
        ToolData,
        DoubleBitmapElementData,
    } from "data-types-graphics";
    import { ClassState, VmBool } from "vm-interfaces-base";
    import { VmStateContainer } from "vm-types";

    export interface PenToolState {
        readonly handle: number;
        color: StringColor;
        width: number;
    }

    export interface BrushToolState {
        readonly handle: number;
        color: StringColor;
        fillType: "SOLID" | "NULL" | "PATTERN" | "HATCED";
        bmpTool: BitmapToolState | undefined;
    }

    export interface BitmapToolState {
        readonly handle: number;
        image?: HTMLImageElement;
        dimensions?: Point2D;
        setPixel(x: number, y: number, color: StringColor): VmBool;
        getPixel(x: number, y: number): StringColor;
    }

    export interface FontToolState {
        readonly handle: number;
        readonly name: string;
        readonly size: number;
        readonly bold: boolean;
    }

    export interface StringToolState {
        readonly handle: number;
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
        | FontToolState
        | StringToolState
        | TextToolState;

    export type ToolTypes = Exclude<ToolData["type"], "ttREFTODOUBLEDIB2D" | "ttREFTODIB2D">;

    export interface GraphicSpaceToolsState {
        createBitmap(bmpFilename: string): BitmapToolState;
        createDoubleBitmap(bmpFilename: string): BitmapToolState;
        createPen(width: number, color: StringColor): PenToolState;
        createFont(fontName: string, size: number, bold: boolean): FontToolState;
        createString(value: string): StringToolState;
        createText(
            font: FontToolState,
            stringFragment: StringToolState,
            foregroundColor: StringColor,
            backgroundColor: StringColor
        ): TextToolState;
        getTool(type: ToolTypes, handle: number): ToolState | undefined;
        deleteTool(type: ToolTypes, handle: number): VmBool;
    }

    export interface _2DObjBaseState {
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

    export interface LineObjectState extends _2DObjBaseState {
        readonly type: LineElementData["type"];
        pen: PenToolState | undefined;
        brush: BrushToolState | undefined;
        getPoint(index: number): Point2D;
        setPointPosition(index: number, x: number, y: number): VmBool;
        addPoint(index: number, x: number, y: number): VmBool;
    }
    export interface ControlObjectState extends _2DObjBaseState {
        readonly type: ControlElementData["type"];
        text: string;
    }
    export interface TextObjectState extends _2DObjBaseState {
        readonly type: TextElementData["type"];
        textTool: TextToolState;
    }
    interface _BmpBase extends _2DObjBaseState {
        setRect(x: number, y: number, width: number, height: number): VmBool;
    }
    export interface BitmapObjectState extends _BmpBase {
        readonly type: (BitmapElementData | DoubleBitmapElementData)["type"];
        bmpTool: BitmapToolState;
        setRect(x: number, y: number, width: number, height: number): VmBool;
    }
    export interface GroupObjectState extends _2DObjBaseState {
        readonly type: GroupElementData["type"];
        getItem(index: number): GraphicObjectState | undefined;
        hasItem(obj: GraphicObjectState): VmBool;
        addItem(obj: GraphicObjectState): VmBool;
        removeItem(obj: GraphicObjectState): VmBool;
    }

    export type GraphicObjectState =
        | LineObjectState
        | ControlObjectState
        | TextObjectState
        | BitmapObjectState
        | GroupObjectState;

    export interface GraphicSpaceState {
        readonly handle: number;
        readonly tools: GraphicSpaceToolsState;
        readonly originX: number;
        readonly originY: number;
        readonly sourceFilename: string;
        setOrigin(x: number, y: number): VmBool;

        createText(x: number, y: number, angle: number, textToolHandle: number): TextObjectState;
        createBitmap(x: number, y: number, dibHandle: number, isDouble: boolean): BitmapObjectState;
        createLine(points: Point2D[], penHandle: number, brushHandle: number): LineObjectState;
        createGroup(objectHandles: number[]): GroupObjectState | undefined;
        getObject(handle: number): GraphicObjectState | undefined;
        deleteObject(handle: number): VmBool;
        deleteGroup(object: GroupObjectState): VmBool;
        moveObjectToTop(handle: number): VmBool;

        subscribe(ctx: VmStateContainer, klass: ClassState, msg: number, objectHandle: number, flags: number): void;

        findObjectByName(objectName: string, group?: GroupObjectState): GraphicObjectState | undefined;
        getObjectFromPoint(x: number, y: number): GraphicObjectState | undefined;
        isIntersect(obj: GraphicObjectState, obj2: GraphicObjectState): VmBool;
    }
}
