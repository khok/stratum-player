import { NumBool } from "../types";

export interface WindowWithSpace {
    readonly name: string;
    readonly classname: string;
    readonly filename: string;

    readonly originX: number;
    readonly originY: number;
    setOrigin(x: number, y: number): NumBool;

    readonly width: number;
    readonly height: number;
    setSize(width: number, height: number): NumBool;
}
