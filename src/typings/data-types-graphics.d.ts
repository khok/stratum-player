declare module "data-types-graphics" {
    /**
     * Строка вида `rgb(r, g, b)`
     */
    export type StringColor = string;
    export type BmpImage = string;
    export type Point2D = { x: number; y: number };

    interface _ToolDataBase {
        handle: number;
    }

    export interface BrushToolData extends _ToolDataBase {
        type: "ttBRUSH2D";
        color: StringColor;
        style: number;
        hatch: number;
        rop2: number;
        dibHandle: number;
    }

    export interface PenToolData extends _ToolDataBase {
        type: "ttPEN2D";
        color: StringColor;
        style: number;
        width: number;
        rop2: number;
    }

    export interface FontToolData extends _ToolDataBase {
        type: "ttFONT2D";
        OldLogfont: unknown;
        size: number;
        style: number;
    }

    export interface StringToolData extends _ToolDataBase {
        type: "ttSTRING2D";
        data: string;
    }

    export interface TextToolData extends _ToolDataBase {
        type: "ttTEXT2D";
        textCollection: {
            ltFgColor: StringColor;
            ltBgColor: StringColor;
            fontHandle: number;
            stringHandle: number;
        }[];
    }

    export interface BitmapToolData extends _ToolDataBase {
        type: "ttDIB2D";
        image: BmpImage;
    }

    export interface DoubleBitmapToolData extends _ToolDataBase {
        type: "ttDOUBLEDIB2D";
        image: BmpImage;
    }

    export interface ExternalBitmapToolData extends _ToolDataBase {
        type: "ttREFTODIB2D";
        filename: string;
    }

    export interface ExternalDoubleBitmapToolData extends _ToolDataBase {
        type: "ttREFTODOUBLEDIB2D";
        filename: string;
    }

    export type ImageToolData =
        | BitmapToolData
        | DoubleBitmapToolData
        | ExternalBitmapToolData
        | ExternalDoubleBitmapToolData;

    export type ToolData = BrushToolData | PenToolData | FontToolData | StringToolData | TextToolData | ImageToolData;

    interface _ElementBaseData {
        handle: number;
        options: number;
        name: string;
    }

    interface _Element2dBaseData extends _ElementBaseData {
        position: Point2D;
        size: Point2D;
    }

    export interface GroupElementData extends _ElementBaseData {
        type: "otGROUP2D";
        childHandles: number[];
    }

    export interface LineElementData extends _Element2dBaseData {
        type: "otLINE2D";
        penHandle: number;
        brushHandle: number;
        points: Point2D[];
        arrows?: Uint8Array;
    }

    interface _BitmapBaseData extends _Element2dBaseData {
        bmpOrigin: Point2D;
        bmpSize: Point2D;
        bmpAngle: number;
    }

    export interface BitmapElementData extends _BitmapBaseData {
        type: "otBITMAP2D";
        dibHandle: number;
    }

    export interface DoubleBitmapElementData extends _BitmapBaseData {
        type: "otDOUBLEBITMAP2D";
        doubleDibHandle: number;
    }

    export interface TextElementData extends _Element2dBaseData {
        type: "otTEXT2D";
        textHandle: number;
        delta: number;
        angle: number;
    }

    export interface ControlElementData extends _Element2dBaseData {
        type: "otCONTROL2D";
        classname: "Edit" | "Button" | "ComboBox";
        text: string;
        dwStyle: number;
        exStyle: number;
        id: number;
        controlSize: Point2D;
    }

    export type Element2dData =
        | LineElementData
        | BitmapElementData
        | DoubleBitmapElementData
        | TextElementData
        | ControlElementData;

    export type ElementData = Element2dData | GroupElementData;

    export interface VectorDrawToolsData {
        brushTools?: BrushToolData[];
        penTools?: PenToolData[];
        bitmapTools?: ImageToolData[];
        doubleBitmapTools?: ImageToolData[];
        fontTools?: FontToolData[];
        stringTools?: StringToolData[];
        textTools?: TextToolData[];
    }

    export type VdrLayers = [boolean, boolean, boolean, boolean];

    export interface VectorDrawData extends VectorDrawToolsData {
        origin: Point2D;
        brushHandle?: number;
        state: number;
        defaultFlags: number;
        fileversion: number;
        layers: VdrLayers;
        minVersion: number;
        elements?: ElementData[];
        elementOrder?: number[];
    }
}
