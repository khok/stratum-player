import { NumBool } from "..";

export interface ProjectFunctions {
    closeAll(): void;
    openSchemeWindow(wname: string, className: string, attribute: string): number;
    loadSpaceWindow(wname: string, fileName: string, attribute: string): number;
    createObjectFromFile2D(hspace: number, fileName: string, x: number, y: number, flags: number): number;
    createDIB2d(hspace: number, fileName: string): number;
    createDoubleDib2D(hspace: number, fileName: string): number;
    getClassDirectory(className: string): string;
    fileExist(fileName: string): NumBool;
}
