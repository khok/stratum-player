import { Point2D } from "stratum/helpers/types";
import { VectorDrawingElement } from "./vectorDrawingElements";
import {
    BrushToolParams,
    DibToolParams,
    DoubleDibToolParams,
    ExternalDibToolParams,
    ExternalDoubleDibToolParams,
    FontToolParams,
    PenToolParams,
    StringToolParams,
    TextToolParams,
} from "./vectorDrawingTools";

export interface VectorDrawingTools {
    penTools?: PenToolParams[];
    brushTools?: BrushToolParams[];
    dibTools?: (DibToolParams | ExternalDibToolParams)[];
    doubleDibTools?: (DoubleDibToolParams | ExternalDoubleDibToolParams)[];
    fontTools?: FontToolParams[];
    stringTools?: StringToolParams[];
    textTools?: TextToolParams[];
}

export interface CoordinateSystem {
    type: number;
    objectHandle: number;
    center: Point2D;
    matrix: number[];
}

/**
 * Формат файла, описывающий содержимое векторного пространства.
 * Разделен на два интерфейса для удобства.
 */

export interface VDRSource {
    origin: "file" | "class";
    name: string;
}

export enum WindowStyle {
    SWF_AUTOSCROLL = 1,
    SWF_HSCROLL = 2,
    SWF_VSCROLL = 4,

    SWF_SPACESIZE = 8, //по размеру пространства
    SWF_NORESIZE = 16, //нельзя менять

    SWF_DIALOG = 32, //Диалоговое окно
    SWF_POPUP = 64, //Всплывающее окно
    SWF_MDI = 128, //MDI окно
    SWF_WINTYPE = 32 | 64 | 128, //Окно имеет тип (перечимслены выше)

    SWF_MODAL = 256, //Модальное

    SWF_AUTOORG = 512, //Автоопределение начала
    SWF_MAXIMIZE = 1024, //Максимизированное
    SWF_MINIMIZE = 2048, //Минимизированное
}

export interface VDRSettings {
    /**
     * Битовая сумма WindowStyle
     */
    style: number;
    x: number;
    y: number;
}

export interface Grid {
    offsetX: number;
    offsetY: number;
    stepX: number;
    stepY: number;
    visible: boolean;
    use: boolean;
}

export enum VDRState {
    DISABLE_SUBWINDOW = 1,
    CAN_SELECT_UNSELECTABLE = 8,
}

export interface VectorDrawingBase extends VectorDrawingTools {
    version: number;
    origin: Point2D;
    scaleDiv: Point2D;
    scaleMul: Point2D;
    //Устанавливается через SetSpaceParam2d
    /**
     * Битовая сумма VDRState
     */
    state: number;
    flags: number;
    brushHandle: number;
    layers: number;

    elements?: VectorDrawingElement[];
    elementOrder?: number[];
    crdSystem?: CoordinateSystem;
    grid?: Grid;
    settings?: VDRSettings;
}

export interface VectorDrawing extends VectorDrawingBase {
    source: VDRSource;
}
