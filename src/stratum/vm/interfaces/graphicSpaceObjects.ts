import { BitmapElement, ControlElement, DoubleBitmapElement, GroupElement, LineElement, TextElement } from "stratum/fileFormats/vdr";
import { Point2D } from "stratum/helpers/types";
import { NumBool } from "../types";
import { BmpTool, BrushTool, PenTool, TextTool } from "./graphicSpaceTools";

export interface Object2dBase {
    readonly handle: number;
    readonly parent: GroupObject | undefined;

    readonly name: string;
    setName(name: string): NumBool;

    readonly positionX: number;
    readonly positionY: number;
    setPosition(x: number, y: number): NumBool;

    readonly width: number;
    readonly height: number;
    setSize(width: number, height: number): NumBool;

    readonly angle: number;
    rotate(centerX: number, centerY: number, angleRad: number): NumBool;

    readonly zOrder: number;
    setZorder(zOrder: number): NumBool;

    readonly isVisible: NumBool;
    setVisibility(visible: NumBool): NumBool;
}

export interface BitmapObject extends Object2dBase {
    readonly type: (BitmapElement | DoubleBitmapElement)["type"];
    readonly bmpTool: BmpTool;

    setRect(x: number, y: number, width: number, height: number): NumBool;
    changeBmpTool(tool: BmpTool): NumBool;
}

export interface ControlObject extends Object2dBase {
    readonly type: ControlElement["type"];
    readonly text: string;
    setText(value: string): NumBool;
}

export interface LineObject extends Object2dBase {
    readonly type: LineElement["type"];
    readonly pen: PenTool | undefined;
    readonly brush: BrushTool | undefined;

    getPoint(index: number): Point2D;
    setPointPosition(index: number, x: number, y: number): NumBool;
    addPoint(index: number, x: number, y: number): NumBool;

    changePen(pen: PenTool | undefined): NumBool;
    changeBrush(brush: BrushTool | undefined): NumBool;
}

export interface TextObject extends Object2dBase {
    readonly type: TextElement["type"];
    readonly textTool: TextTool;
    changeTextTool(textTool: TextTool): NumBool;
}

export interface GroupObject extends Object2dBase {
    readonly type: GroupElement["type"];

    getItem(index: number): GraphicSpaceObject | undefined;
    hasItem(obj: GraphicSpaceObject): NumBool;
    addItem(obj: GraphicSpaceObject): NumBool;
    removeItem(obj: GraphicSpaceObject): NumBool;
}

export type GraphicSpaceObject = BitmapObject | ControlObject | GroupObject | LineObject | TextObject;
