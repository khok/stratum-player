/**
 * Код для вставки изображений и иконок подимиджей в схему родительского имиджа.
 * Сей процесс также именуется как "композиция схемы".
 *
 * В общем, процесс (см. метод `VdrMerger.insertChildImage`) выглядит следующим образом:
 *  1) Для подимиджа создается его копия.
 *  2) В схему родителя копируются инструменты подимиджа.
 *  3) Для элементов имиджа обновляются ссылки на инструменты, поскольку после вставки дескрипторы меняются.
 * Для некоторых инструментов также обновляются взаимные ссылки.
 *  4) В схему вставляются элементы подимиджа. Все они добавляются в корневую группу,
 * дескриптор которой совпадает с дескриптором подимиджа.
 *  5) Для групп подимиджа обновляются ссылки на составляющие их элементы.
 *  6) В конец порядка размещения элементов схемы добавляется порядок элементов подимиджа.
 *
 */

import { Point2D } from "stratum/helpers/types";
import { Require } from "stratum/helpers/utilityTypes";
import { VectorDrawing, VectorDrawingTools } from "./fileFormats/vdr/types/vectorDrawing";
import {
    BitmapElement,
    DoubleBitmapElement,
    GroupElement,
    LineElement,
    TextElement,
    VectorDrawingElement,
} from "./fileFormats/vdr/types/vectorDrawingElements";
import { ExternalDoubleBmpToolParams, VectorDrawingToolParams } from "./fileFormats/vdr/types/vectorDrawingTools";
import { BadDataError } from "./errors";

const toolKeys: (keyof VectorDrawingTools)[] = [
    "brushTools",
    "penTools",
    "bitmapTools",
    "doubleBitmapTools",
    "fontTools",
    "stringTools",
    "textTools",
];

function copyArray<T extends object>(arr?: Array<T>) {
    if (!arr) return undefined;
    return arr.map((el) => ({ ...el }));
}

function deepVdrCopy(vdr: VectorDrawing) {
    const dataCopy = { ...vdr };
    dataCopy.brushTools = copyArray(vdr.brushTools);
    dataCopy.penTools = copyArray(vdr.penTools);
    dataCopy.bitmapTools = copyArray(vdr.bitmapTools);
    dataCopy.doubleBitmapTools = copyArray(vdr.doubleBitmapTools);
    dataCopy.fontTools = copyArray(vdr.fontTools);
    dataCopy.stringTools = copyArray(vdr.stringTools);
    dataCopy.textTools = vdr.textTools && vdr.textTools.map((t) => ({ ...t, textCollection: t.textCollection.map((c) => ({ ...c })) }));
    dataCopy.elements = copyArray(vdr.elements);
    dataCopy.elementOrder = vdr.elementOrder && vdr.elementOrder.slice();
    return dataCopy;
}

function findRootGroup(elements: VectorDrawingElement[], rootGroupHandle: number) {
    const rootGroup = elements.find((el) => el.handle === rootGroupHandle);
    if (!rootGroup || rootGroup.type !== "otGROUP2D") throw new BadDataError(`На схеме нет группы ${rootGroupHandle}`);
    return rootGroup;
}

function getStubIcon(elements: VectorDrawingElement[], rootGroup: GroupElement) {
    const stubIconHandle = rootGroup.childHandles[0];

    const stubIcon = elements.find((el) => el.handle === stubIconHandle);
    if (!stubIcon || stubIcon.type !== "otDOUBLEBITMAP2D") return undefined;
    return stubIcon;
}

function insertTools(schemeTools: VectorDrawingToolParams[], imageTools: VectorDrawingToolParams[]) {
    const map = new Map<number, number>();
    let freeHandle = 1;
    for (const tool of imageTools) {
        while (schemeTools.some((t) => t.handle === freeHandle)) freeHandle++;
        map.set(tool.handle, freeHandle);
        tool.handle = freeHandle;
        schemeTools.push(tool);
    }
    return map;
}

function mergeTools(scheme: VectorDrawingTools, image: VectorDrawingTools) {
    const maps: { [key in keyof VectorDrawingTools]: Map<number, number> } = {};
    for (const k of toolKeys) {
        const childTools: VectorDrawingToolParams[] | undefined = image[k];
        if (!childTools) continue;
        const parentTools: VectorDrawingToolParams[] | undefined = scheme[k];
        if (!parentTools) {
            (<typeof childTools>scheme[k]) = childTools;
            continue;
        }
        maps[k] = insertTools(parentTools, childTools);
    }
    return maps;
}

function updateHandles<T, K extends keyof T>(objects: T[] | undefined, handleField: K, map: Map<T[K], T[K]>) {
    if (!objects) return;
    for (const obj of objects) {
        const handle = obj[handleField];
        obj[handleField] = map.get(handle) || handle;
    }
}

function updateRefsFromToolsToTools(tools: VectorDrawingTools, collectionType: keyof VectorDrawingTools, map: Map<number, number>) {
    switch (collectionType) {
        case "fontTools": {
            const { textTools } = tools;
            if (textTools) textTools.forEach((t) => updateHandles(t.textCollection, "fontHandle", map));
            break;
        }
        case "stringTools": {
            const { textTools } = tools;
            if (textTools) textTools.forEach((t) => updateHandles(t.textCollection, "stringHandle", map));
            break;
        }
        case "bitmapTools": {
            updateHandles(tools.brushTools, "dibHandle", map);
            break;
        }
    }
}

function updateRefsFromElementsToTools(
    elements: VectorDrawingElement[],
    collectionType: keyof VectorDrawingTools,
    map: Map<number, number>
) {
    switch (collectionType) {
        case "brushTools":
            const lines = elements.filter((t): t is LineElement => t.type === "otLINE2D");
            updateHandles(lines, "brushHandle", map);
            break;
        case "penTools":
            const linesAgain = elements.filter((t): t is LineElement => t.type === "otLINE2D");
            updateHandles(linesAgain, "penHandle", map);
            break;
        case "bitmapTools":
            const bitmaps = elements.filter((t): t is BitmapElement => t.type === "otBITMAP2D");
            updateHandles(bitmaps, "bmpHandle", map);
            break;
        case "doubleBitmapTools":
            const doublebitmaps = elements.filter((t): t is DoubleBitmapElement => t.type === "otDOUBLEBITMAP2D");
            updateHandles(doublebitmaps, "bmpHandle", map);
            break;
        case "textTools":
            const texts = elements.filter((t): t is TextElement => t.type === "otTEXT2D");
            updateHandles(texts, "textToolHandle", map);
            break;
    }
}

function updateRefsToTools(image: VectorDrawing, toolMaps: { [key in keyof VectorDrawingTools]: Map<number, number> }) {
    for (const k of toolKeys) {
        const map = toolMaps[k];
        if (!map) continue;
        updateRefsFromToolsToTools(image, k, map);
        if (image.elements) updateRefsFromElementsToTools(image.elements, k, map);
    }
}

function calcImageOrigin(elements: VectorDrawingElement[]) {
    let minX = undefined;
    let minY = undefined;
    for (const el of elements) {
        if (el.type === "otGROUP2D") continue;
        if (minX === undefined || el.position.x < minX) minX = el.position.x;
        if (minY === undefined || el.position.y < minY) minY = el.position.y;
    }
    return { x: minX || 0, y: minY || 0 };
}

function isElementInGroup(elements: VectorDrawingElement[], child: VectorDrawingElement) {
    return elements.some((e) => e.type === "otGROUP2D" && e.childHandles.includes(child.handle));
}

function mergeElements(schemeElements: VectorDrawingElement[], imageElements: VectorDrawingElement[], offset: Point2D) {
    const map = new Map<number, number>();
    if (imageElements.length === 0) return { map, rootHandle: 0 };
    let freeHandle = 1;
    const newGroupHandles: number[] = [];
    for (const child of imageElements) {
        if (child.type !== "otGROUP2D") child.position = { x: child.position.x + offset.x, y: child.position.y + offset.y };
        while (schemeElements.some((e) => e.handle === freeHandle)) freeHandle++;
        if (!isElementInGroup(imageElements, child)) newGroupHandles.push(freeHandle);
        map.set(child.handle, freeHandle);
        child.handle = freeHandle;
        schemeElements.push(child);
    }
    if (imageElements.length === 1) return { map, rootHandle: imageElements[0].handle };
    while (schemeElements.some((e) => e.handle === freeHandle)) freeHandle++;
    const newGroup: GroupElement = {
        type: "otGROUP2D",
        handle: freeHandle,
        childHandles: newGroupHandles,
        options: 0,
        name: "",
    };
    schemeElements.push(newGroup);
    return { map, rootHandle: newGroup.handle };
}

function updateRefsFromGroupsToElements(elements: VectorDrawingElement[], map: Map<number, number>) {
    for (const el of elements) {
        if (el.type !== "otGROUP2D") continue;
        el.childHandles = el.childHandles.map((elHandle) => map.get(elHandle) || elHandle);
    }
}

function mapElementOrder(order: number[], map: Map<number, number>) {
    return order.map((handle) => map.get(handle) || handle);
}

function schemeHasElements(scheme: VectorDrawing): scheme is Require<VectorDrawing, "elements"> {
    return scheme.elements !== undefined && scheme.elements.length > 0;
}

export class VdrMerger {
    scheme: Require<VectorDrawing, "elements">; //Сделаем свойство "elements" обязательным.
    /**
     * Создает вспомогательный класс для вставки изображений и иконок дочерних имиджей в схему родительского имиджа.
     * @param scheme - схема родительского имиджа.
     */
    constructor(scheme: VectorDrawing) {
        const schemeCopy = deepVdrCopy(scheme);
        if (!schemeHasElements(schemeCopy)) throw new BadDataError(`Схема не имеет элементов`);
        this.scheme = schemeCopy;
    }

    get result() {
        return this.scheme;
    }

    /**
     * Вставляет в схему изображение подимиджа.
     * @param rootGroupHandle - Дескриптор подимиджа, совпадает с дескриптором группы, в которую производится вставка.
     * @param image - Изображение подимиджа.
     * @param offset - смещение изображения подимиджа.
     */
    insertChildImage(rootGroupHandle: number, image: VectorDrawing, offset: Point2D) {
        const { scheme } = this;
        const imageCopy = deepVdrCopy(image);

        const toolMaps = mergeTools(scheme, imageCopy);
        updateRefsToTools(imageCopy, toolMaps);

        if (!imageCopy.elements) return;

        const rootGroup = findRootGroup(scheme.elements, rootGroupHandle);
        const stubIcon = getStubIcon(scheme.elements, rootGroup);
        if (stubIcon) stubIcon.options = 0x0001; //прячем иконку-заглушку.

        const imageOrigin = calcImageOrigin(imageCopy.elements);
        const realOffset = { x: offset.x - imageOrigin.x, y: offset.y - imageOrigin.y };
        const { map, rootHandle } = mergeElements(scheme.elements, imageCopy.elements, realOffset);
        updateRefsFromGroupsToElements(imageCopy.elements, map);
        rootGroup.childHandles.push(rootHandle);

        if (!imageCopy.elementOrder) return;

        const imageZOrder = mapElementOrder(imageCopy.elementOrder, map);
        const schemeZOrder = scheme.elementOrder;

        scheme.elementOrder = schemeZOrder ? schemeZOrder.concat(imageZOrder) : imageZOrder;
    }

    /**
     * Заменяет иконку подимижа на схеме.
     * @param rootGroupHandle - Дескриптор подимиджа, совпадает с дескриптором группы, в которой находится иконка.
     * @param iconFile - Имя файла иконки.
     */
    replaceIcon(rootGroupHandle: number, iconFile: string) {
        const { scheme } = this;

        const rootGroup = findRootGroup(scheme.elements, rootGroupHandle);
        const stubIcon = getStubIcon(scheme.elements, rootGroup);
        if (!stubIcon) return;

        const bmpTool: ExternalDoubleBmpToolParams = { type: "ttREFTODOUBLEDIB2D", handle: 0, filename: iconFile };

        let freeHandle = 1;
        if (scheme.doubleBitmapTools) {
            while (scheme.doubleBitmapTools.some((el) => el.handle === freeHandle)) freeHandle++;
            scheme.doubleBitmapTools.push(bmpTool);
        } else {
            scheme.doubleBitmapTools = [bmpTool];
        }
        stubIcon.bmpHandle = bmpTool.handle = freeHandle;
    }
}
