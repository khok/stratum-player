import { StratumImage } from "./deserializers";
import { IGraphicObject, ISchemeInstance } from "./vm";

export default class SchemeInstance implements ISchemeInstance {
    scale: number = 0;
    topLeft: { x: number; y: number };
    size: { x: number; y: number } = { x: 0, y: 0 };
    constructor(image: StratumImage, canvas: HTMLCanvasElement) {
        this.topLeft = image.topLeft;
        // this.size = image
    }
    getObjectHandleFromPoint(x: number, y: number): number {
        throw new Error("Method not implemented.");
    }
    findObjectHandle(groupHandle: number, objectName: string): number {
        throw new Error("Method not implemented.");
    }
    getObject(objectHandle: number): IGraphicObject | undefined {
        throw new Error("Method not implemented.");
    }
    setTopLeft(x: number, y: number): boolean {
        throw new Error("Method not implemented.");
    }
    setScale(scale: number): boolean {
        throw new Error("Method not implemented.");
    }
}
