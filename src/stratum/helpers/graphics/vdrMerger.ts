import {
    BitmapElementData,
    DoubleBitmapElementData,
    ElementData,
    GroupElementData,
    LineElementData,
    Point2D,
    TextElementData,
    ToolData,
    VectorDrawData,
    VectorDrawToolsData,
    ImageToolData,
} from "data-types-graphics";
import { StratumError } from "~/helpers/errors";

const toolKeys: (keyof VectorDrawToolsData)[] = [
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

function deepVdrCopy(vdr: VectorDrawData) {
    const dataCopy = { ...vdr };
    dataCopy.brushTools = copyArray(vdr.brushTools);
    dataCopy.penTools = copyArray(vdr.penTools);
    dataCopy.bitmapTools = copyArray(vdr.bitmapTools);
    dataCopy.doubleBitmapTools = copyArray(vdr.doubleBitmapTools);
    dataCopy.fontTools = copyArray(vdr.fontTools);
    dataCopy.stringTools = copyArray(vdr.stringTools);
    dataCopy.textTools =
        vdr.textTools && vdr.textTools.map((t) => ({ ...t, textCollection: t.textCollection.map((c) => ({ ...c })) }));
    dataCopy.elements = copyArray(vdr.elements);
    dataCopy.elementOrder = vdr.elementOrder && vdr.elementOrder.slice();
    return dataCopy;
}

function insertTools(schemeTools: ToolData[], imageTools: ToolData[]) {
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

function mergeTools(scheme: VectorDrawToolsData, image: VectorDrawToolsData) {
    const maps: { [key in keyof VectorDrawToolsData]: Map<number, number> } = {};
    for (const k of toolKeys) {
        const childTools: ToolData[] | undefined = image[k];
        if (!childTools) continue;
        const parentTools: ToolData[] | undefined = scheme[k];
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

function updateRefsFromToolsToTools(
    tools: VectorDrawToolsData,
    collectionType: keyof VectorDrawToolsData,
    map: Map<number, number>
) {
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
            //а почему не doubleBitmapTools?
            updateHandles(tools.brushTools, "dibHandle", map);
            break;
        }
    }
}

function updateRefsFromElementsToTools(
    elements: ElementData[],
    collectionType: keyof VectorDrawToolsData,
    map: Map<number, number>
) {
    switch (collectionType) {
        case "brushTools":
            updateHandles(
                (elements as LineElementData[]).filter((t) => t.type === "otLINE2D") as LineElementData[],
                "brushHandle",
                map
            );
            break;
        case "penTools":
            updateHandles(
                (elements as LineElementData[]).filter((t) => t.type === "otLINE2D"),
                "penHandle",
                map
            );
            break;
        case "bitmapTools":
            updateHandles(
                (elements as BitmapElementData[]).filter((t) => t.type === "otBITMAP2D"),
                "dibHandle",
                map
            );
            break;
        case "doubleBitmapTools":
            updateHandles(
                (elements as DoubleBitmapElementData[]).filter((t) => t.type === "otDOUBLEBITMAP2D"),
                "doubleDibHandle",
                map
            );
            break;
        case "textTools":
            updateHandles(
                (elements as TextElementData[]).filter((t) => t.type === "otTEXT2D"),
                "textToolHandle",
                map
            );
            break;
    }
}

function updateRefsToTools(
    image: VectorDrawData,
    toolMaps: { [key in keyof VectorDrawToolsData]: Map<number, number> }
) {
    for (const k of toolKeys) {
        const map = toolMaps[k];
        if (!map) continue;
        updateRefsFromToolsToTools(image, k, map);
        if (image.elements) updateRefsFromElementsToTools(image.elements, k, map);
    }
}

function hideStubIcon(schemeElements: ElementData[], stubIconHandle: number) {
    const stubIcon = schemeElements.find((el) => el.handle === stubIconHandle)!;
    stubIcon.options = 0x0001; //делаем ему хайден
}

function calcImageOrigin(elements: ElementData[]) {
    let minX = undefined;
    let minY = undefined;
    for (const el of elements) {
        if (el.type === "otGROUP2D") continue;
        if (minX === undefined || el.position.x < minX) minX = el.position.x;
        if (minY === undefined || el.position.y < minY) minY = el.position.y;
    }
    return { x: minX || 0, y: minY || 0 };
}

function isElementInGroup(elements: ElementData[], child: ElementData) {
    return elements.some((e) => e.type === "otGROUP2D" && e.childHandles.includes(child.handle));
}

function mergeElements(schemeElements: ElementData[], imageElements: ElementData[], offset: Point2D) {
    const map = new Map<number, number>();
    if (imageElements.length === 0) return { map, rootHandle: 0 };
    let freeHandle = 1;
    const newGroupHandles: number[] = [];
    for (const child of imageElements) {
        if (child.type !== "otGROUP2D")
            child.position = { x: child.position.x + offset.x, y: child.position.y + offset.y };
        while (schemeElements.some((e) => e.handle === freeHandle)) freeHandle++;
        if (!isElementInGroup(imageElements, child)) newGroupHandles.push(freeHandle);
        map.set(child.handle, freeHandle);
        child.handle = freeHandle;
        schemeElements.push(child);
    }
    if (imageElements.length === 1) return { map, rootHandle: imageElements[0].handle };
    while (schemeElements.some((e) => e.handle === freeHandle)) freeHandle++;
    const newGroup: GroupElementData = {
        type: "otGROUP2D",
        handle: freeHandle,
        childHandles: newGroupHandles,
        options: 0,
        name: "",
    };
    schemeElements.push(newGroup);
    return { map, rootHandle: newGroup.handle };
}

function updateRefsFromGroupsToElements(elements: ElementData[], map: Map<number, number>) {
    for (const el of elements) {
        if (el.type !== "otGROUP2D") continue;
        el.childHandles = el.childHandles.map((elHandle) => map.get(elHandle) || elHandle);
    }
}

function updateElementOrder(order: number[], map: Map<number, number>) {
    return order.map((handle) => map.get(handle) || handle);
}

function recreateElementOrder(schemeElementOrder: number[], imageElementOrder: number[], fromHandle: number) {
    const newElementOrder: number[] = [];
    schemeElementOrder.forEach((handle) => {
        if (handle !== fromHandle) newElementOrder.push(handle);
        else imageElementOrder.forEach((chldH) => newElementOrder.push(chldH));
    });
    return newElementOrder;
}

export class VdrMerger {
    scheme: VectorDrawData & { elements: ElementData[] }; //Сделаем свойство "elements" обязательным.
    /**
     * Создает вспомогательный класс для вставки изображений и иконок дочерних имиджей в схему родительского имиджа.
     * @param scheme - схема родительского имиджа.
     */
    constructor(scheme: VectorDrawData) {
        const schemeCopy = deepVdrCopy(scheme);
        if (!schemeCopy.elements) throw new StratumError("Объект не содержит элементов");
        this.scheme = schemeCopy as VdrMerger["scheme"];
    }

    get data() {
        return this.scheme;
    }

    insertChildImage(rootGroupHandle: number, image: VectorDrawData, offset: Point2D) {
        const { scheme } = this;
        const imageCopy = deepVdrCopy(image);

        const toolMaps = mergeTools(scheme, imageCopy);
        updateRefsToTools(imageCopy, toolMaps);

        if (!imageCopy.elements) return;

        const rootGroup = scheme.elements.find((el) => el.handle === rootGroupHandle);
        if (!rootGroup || rootGroup.type !== "otGROUP2D")
            throw new StratumError(`На схеме нет группы ${rootGroupHandle}`);

        const stubIconHandle = rootGroup.childHandles[0];
        hideStubIcon(scheme.elements, stubIconHandle);

        const imageOrigin = calcImageOrigin(imageCopy.elements);
        const realOffset = { x: offset.x - imageOrigin.x, y: offset.y - imageOrigin.y };
        const { map, rootHandle } = mergeElements(scheme.elements, imageCopy.elements, realOffset);
        updateRefsFromGroupsToElements(imageCopy.elements, map);
        rootGroup.childHandles.push(rootHandle);

        if (!imageCopy.elementOrder) return;

        const newOrder = updateElementOrder(imageCopy.elementOrder, map);
        scheme.elementOrder = scheme.elementOrder
            ? recreateElementOrder(scheme.elementOrder, newOrder, stubIconHandle)
            : imageCopy.elementOrder;
    }

    replaceIcon(rootGroupHandle: number, iconFile: string) {
        const { scheme } = this;

        const parentGroup = scheme.elements.find((el) => el.handle === rootGroupHandle);
        if (!parentGroup || parentGroup.type !== "otGROUP2D")
            throw new StratumError(`На схеме нет группы ${parentGroup}`);

        const stubIconHandle = parentGroup.childHandles[0];
        const stubIcon = scheme.elements.find((el) => el.handle === stubIconHandle);
        if (!stubIcon || stubIcon.type !== "otDOUBLEBITMAP2D") return;

        const iconBmpTool: ImageToolData = { type: "ttREFTODOUBLEDIB2D", handle: 0, filename: iconFile };

        let freeHandle = 1;
        if (scheme.doubleBitmapTools) {
            while (scheme.doubleBitmapTools.some((el) => el.handle === freeHandle)) freeHandle++;
            scheme.doubleBitmapTools.push(iconBmpTool);
        } else {
            scheme.doubleBitmapTools = [iconBmpTool];
        }
        stubIcon.doubleDibHandle = iconBmpTool.handle = freeHandle;
    }
}
