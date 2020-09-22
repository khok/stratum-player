import { fabric } from "fabric";

export const canvasOptions: fabric.ICanvasOptions = {
    selection: false,
    preserveObjectStacking: true,
    renderOnAddRemove: false,
};

export const objectOptions: fabric.IObjectOptions = {
    selectable: false,
    hoverCursor: "pointer",
};
