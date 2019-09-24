import { fabric } from "fabric";
import { Element2d, VectorDrawData, BitmapBase } from "./types";

const urlCache = new Map<string, any>();
const iconsPath = "data/icons";

function createImage(src: string, element: BitmapBase) {
    //prettier-ignore
    const { size: {x: width, y: height} } = element.data;
    const image = new Image(width, height);
    image.src = src;
    return new fabric.Image(image, { width, height });
    // const stub = new fabric.Rect({ fill: "gray", width: size.x, height: size.y });
}

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
            const bmp = doubleBitmaps!.get(element.data.sourceHandle)!;
            const src = bmp.type == "bitmapRef" ? `${iconsPath}/${bmp.filename.toUpperCase()}` : bmp.images[0];
            return createImage(src, element);
        }
        case "bitmap": {
            const bmp = bitmaps!.get(element.data.sourceHandle)!;
            const src = bmp.type == "bitmapRef" ? `${iconsPath}/${bmp.filename.toUpperCase()}` : bmp.image;
            return createImage(src, element);
        }
        case "control":
            throw new Error("Control Not implemented.");
    }
}
