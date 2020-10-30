import { VectorDrawing } from "stratum/fileFormats/vdr";
import { NumBool } from "../types";
import { GraphicSpace } from "./graphicSpace";
import { WindowWithSpace } from "./windowWithSpace";

export interface WindowsManager {
    readonly areaOriginX: number;
    readonly areaOriginY: number;
    readonly areaWidth: number;
    readonly areaHeight: number;

    readonly screenHeight: number;
    readonly screenWidth: number;

    openSchemeWindow(windowName: string, attrib: string, vdr?: VectorDrawing): number;
    hasWindow(windowName: string): NumBool;
    getWindow(windowName: string): WindowWithSpace | undefined;

    getSpaceByWinName(windowName: string): GraphicSpace | undefined;
    getSpace(spaceHandle: number): GraphicSpace | undefined;
}
