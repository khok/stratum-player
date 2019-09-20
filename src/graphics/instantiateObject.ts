import { fabric } from "fabric";
import { Element2d, VectorDrawData } from "./types";

export function instantiateObject(
    element: Element2d,
    { bitmaps, brushes, pens, doubleBitmaps, fonts, strings, texts }: VectorDrawData
): fabric.Object {
    switch (element.type) {
        case "line":
            const opts: fabric.IObjectOptions = {};
            const { brushHandle, penHandle, points } = element;
            if (brushHandle) opts.fill = brushes!.get(brushHandle)!.color;
            if (penHandle) {
                const pen = pens!.get(penHandle)!;
                opts.strokeWidth = pen.width || 0.5; //минимально возможная толщина (придумал сам)
                opts.stroke = pen.color;
            }
            /*
             * По идее, здесь должен быть lazy-slice -
             * т.е. копирование происходит только при попытке
             * изменения контура полилинии.
             */
            return new fabric.Polyline(points, opts);
        case "text":
            throw new Error("Text Not implemented.");
        case "doubleBitmap": {
            const { size, sourceHandle } = element.data;
            return new fabric.Rect({ fill: "gray", width: size.x, height: size.y });
        }
        case "bitmap": {
            const { size } = element.data;
            return new fabric.Rect({ fill: "gray", width: size.x, height: size.y });
        }
        case "control":
            throw new Error("Control Not implemented.");
    }
}
