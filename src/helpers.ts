import { StratumError } from "./errors";
import { VarData, ChildData, ClassData } from "./types";
import { HandleMap, VectorDrawData } from "./graphics/types";
import { insertImage, replaceIcon } from "./graphics/schemeComposer";

export function createDefaultValue(type: VarData["type"]) {
    switch (type) {
        case "FLOAT":
            return 0;
        case "HANDLE":
            return 0;
        case "STRING":
            return "";
        case "COLORREF":
            return "rgb(0, 0, 0)";
    }
}

export function parseVarValue(type: VarData["type"], value: string): string | number {
    switch (type) {
        case "STRING":
            return value;
        case "FLOAT":
            return parseFloat(value) || 0;
        case "HANDLE":
            return (value.startsWith("#") ? parseInt(value.substring(1, value.length)) : parseInt(value)) || 0;
        case "COLORREF":
            return value;
    }
    throw new StratumError(`Не удалось распарсить переменную: неизвестный тип "${type}"`);
}

function copyMap<T>(map: HandleMap<T>) {
    const newMap = new Map<number, T>();
    map.forEach((v, k) => newMap.set(k, v));
    return newMap;
}

function makeImageCopy(image: VectorDrawData) {
    const imageCopy = { ...image };
    if (image.elements) imageCopy.elements = copyMap(image.elements);
    if (image.texts) imageCopy.texts = copyMap(image.texts);
    return imageCopy;
}

function recalcImageOrigin(image: VectorDrawData) {
    let x: number | undefined = undefined,
        y: number | undefined = undefined;
    if (!image.elements) return;
    for (const el of image.elements.values()) {
        if (el.type == "group") continue;
        if (x == undefined || el.position.x < x) x = el.position.x;
        if (y == undefined || el.position.y < y) y = el.position.y;
    }
    image.origin = { x: x || 0, y: y || 0 };
}

export function composeScheme(scheme: VectorDrawData, childs: ChildData[], classes: Map<string, ClassData>) {
    for (const c of childs) {
        const childProto = classes.get(c.className)!;
        const { handle: groupHandle, position } = c.onSchemeData;
        if (childProto.image) {
            const image = childProto.image as VectorDrawData & { __originRecalculated?: boolean };
            if (!image.__originRecalculated) {
                recalcImageOrigin(image);
                image.__originRecalculated = true;
            }
            insertImage(scheme, makeImageCopy(childProto.image), groupHandle, position);
        } else {
            const { iconRef, iconIndex } = childProto;
            if (iconRef) replaceIcon(scheme, groupHandle, iconRef, iconIndex || 0);
        }
    }
}
