import { Point2D } from "/helpers/types";
import { VectorDrawing } from "/common/fileFormats/vdr/types/vectorDrawing";
import {
    ExternalBmpToolParams,
    ExternalDoubleBmpToolParams,
    VectorDrawingToolParams,
} from "/common/fileFormats/vdr/types/vectorDrawingTools";
import { ExecutionContext } from "../executionContext";
import { NumBool } from "../types";
import { BitmapObject, GraphicSpaceObject, GroupObject, LineObject, TextObject } from "./graphicSpaceObjects";
import { BmpTool, BrushTool, FontTool, PenTool, StringTool, TextTool } from "./graphicSpaceTools";
import { EventCode } from "../consts";
import { BinaryStream } from "/helpers/binaryStream";
import { WindowWithSpace } from "./windowWithSpace";

/**
 * Можно создавать любые типы инструментов кроме ссылок на внешние изображения.
 */
export type GraphicSpaceToolType = Exclude<
    VectorDrawingToolParams["type"],
    ExternalBmpToolParams["type"] | ExternalDoubleBmpToolParams["type"]
>;

/**
 * Инструменты графического пространства.
 */
export interface GraphicSpaceTools {
    readonly bitmaps: ReadonlyMap<number, BmpTool>;
    readonly brushes: ReadonlyMap<number, BrushTool>;
    readonly doubleBitmaps: ReadonlyMap<number, BmpTool>;
    readonly fonts: ReadonlyMap<number, FontTool>;
    readonly pens: ReadonlyMap<number, PenTool>;
    readonly strings: ReadonlyMap<number, StringTool>;
    readonly texts: ReadonlyMap<number, TextTool>;

    createBitmap(imageStream: BinaryStream): BmpTool | undefined;
    createBrush(color: number, style: number, dibHandle: number): BrushTool;
    createDoubleBitmap(imageStream: BinaryStream): BmpTool | undefined;
    createFont(fontName: string, size: number, bold: boolean): FontTool;
    createPen(width: number, color: number, style: number): PenTool;
    createString(value: string): StringTool;
    createText(fontHandle: number, stringHandle: number, foregroundColor: number, backgroundColor: number): TextTool | undefined;

    deleteTool(type: GraphicSpaceToolType, handle: number): NumBool;
}

/**
 * Графическое пространство.
 */
export interface GraphicSpace {
    readonly window: WindowWithSpace;
    readonly tools: GraphicSpaceTools;
    readonly handle: number;

    readonly originX: number;
    readonly originY: number;
    setOrigin(x: number, y: number): NumBool;

    createBitmap(x: number, y: number, dibHandle: number, isDouble: boolean): BitmapObject | undefined;
    createGroup(objectHandles: number[]): GroupObject | undefined;
    createLine(points: Point2D[], penHandle: number, brushHandle: number): LineObject;
    createText(x: number, y: number, angle: number, textToolHandle: number): TextObject | undefined;

    insertVectorDrawing(vdr: VectorDrawing, x: number, y: number): GraphicSpaceObject | undefined;

    getObject(handle: number): GraphicSpaceObject | undefined;
    deleteObject(handle: number): NumBool;
    deleteGroup(groupHandle: number): NumBool;

    moveObjectToTop(handle: number): NumBool;

    findObjectByName(objectName: string, groupHandle: number): GraphicSpaceObject | undefined;
    getObjectFromPoint(x: number, y: number): GraphicSpaceObject | undefined;
    isIntersect(obj1Handle: number, obj2handle: number): NumBool;

    subscribeToEvent(eventCode: EventCode, objectHandle: number, flags: number, ctx: ExecutionContext): void;
}
