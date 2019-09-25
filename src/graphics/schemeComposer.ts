import {
    Bitmap,
    BitmapRefTool,
    DoubleBitmap,
    Element,
    Element2d,
    Group,
    HandleMap,
    Line,
    Text,
    VectorDrawData
} from "./types";

function isElementInGroup(elemHandle: number, elements: HandleMap<Element>) {
    for (const v of elements.values()) if (v.type == "group" && v.childHandles.includes(elemHandle)) return true;
    return false;
}

function makeEl2d(element: Element2d, offset: { x: number; y: number }): Element2d {
    const position = { x: element.position.x + offset.x, y: element.position.y + offset.y };
    return { ...element, position };
}

function makeGroup(element: Group, handleMap: HandleMap<number>): Group {
    return { ...element, childHandles: element.childHandles.map(h => handleMap.get(h)!) };
}

function insertChilds(
    schemeElements: HandleMap<Element>,
    childElements: HandleMap<Element>,
    childElementOrder: number[],
    globalOffset: { x: number; y: number }
) {
    const newHandleMap = new Map<number, number>();
    let freeHandle = 0;
    const newGroupHandles: number[] = [];
    for (const [elHandle, el] of childElements.entries()) {
        while (schemeElements.has(++freeHandle));
        newHandleMap.set(elHandle, freeHandle);

        schemeElements.set(freeHandle, el.type == "group" ? makeGroup(el, newHandleMap) : makeEl2d(el, globalOffset));
        if (!isElementInGroup(elHandle, childElements)) newGroupHandles.push(freeHandle);
    }
    if (childElements.size == 1) return { freeHandle, childOrder: [freeHandle] };
    const newGroup: Group = {
        type: "group",
        childHandles: newGroupHandles,
        options: 0,
        name: ""
    };
    while (schemeElements.has(++freeHandle));
    schemeElements.set(freeHandle, newGroup);
    return { freeHandle, childOrder: childElementOrder.map(h => newHandleMap.get(h)!) };
}

function hideStubIcon(schemeElements: HandleMap<Element>, group: Group) {
    //я уверен, что объект #{stubIconHandle} (иконка) есть на схеме.
    const stubIconHandle = group.childHandles[0];
    const stubIcon = schemeElements.get(stubIconHandle)!;
    stubIcon.options = 0x0001; //делаем ему хайден
    return stubIconHandle;
}

type ToolData = Pick<VectorDrawData, "brushes" | "pens" | "bitmaps" | "doubleBitmaps" | "fonts" | "strings" | "texts">;
type MapValue<T extends HandleMap<any>> = T extends HandleMap<infer V> ? V : never;
type Tool = MapValue<Required<ToolData>[keyof ToolData]>;

function createMapper<T extends Element>(
    elements: HandleMap<Element>,
    filterType: T["type"],
    get: (obj: T) => number,
    set: (obj: T, handle: number) => void
) {
    return (oldHandle: number, newHandle: number) => {
        for (const c of elements.values()) if (c.type == filterType && get(c as T) == oldHandle) set(c as T, newHandle);
    };
}

function selectToolHandleMapper(
    { elements: els, texts }: VectorDrawData,
    k: keyof ToolData
): ((oldHandle: number, newHandle: number) => void) | undefined {
    if (texts) {
        switch (k) {
            case "fonts":
                return (oldHandle, newHandle) => {
                    for (const t of texts.values()) if (t.fontHandle == oldHandle) t.fontHandle = newHandle;
                };
            case "strings":
                return (oldHandle, newHandle) => {
                    for (const t of texts.values()) if (t.stringHandle == oldHandle) t.stringHandle = newHandle;
                };
        }
    }

    if (!els) return undefined;
    switch (k) {
        case "brushes":
            return createMapper<Line>(els, "line", o => o.brushHandle, (o, handle) => (o.brushHandle = handle));
        case "pens":
            return createMapper<Line>(els, "line", o => o.penHandle, (o, handle) => (o.penHandle = handle));
        case "doubleBitmaps":
            //prettier-ignore
            return createMapper<DoubleBitmap>(els, "doubleBitmap", o => o.data.sourceHandle, (o, handle) => (o.data.sourceHandle = handle));
        case "bitmaps":
            //prettier-ignore
            return createMapper<Bitmap>(els, "bitmap", o => o.data.sourceHandle, (o, handle) => (o.data.sourceHandle = handle));
        case "texts":
            return createMapper<Text>(els, "text", o => o.textHandle, (o, number) => (o.textHandle = number));
    }
    return undefined;
}

function mergeTools(
    schemeTools: HandleMap<Tool>,
    imageTools: HandleMap<Tool>,
    mapChilds?: (oldHandle: number, newHandle: number) => void
) {
    let freeHandle = 0;
    for (const [handle, tool] of imageTools) {
        while (schemeTools.has(++freeHandle));
        schemeTools.set(freeHandle, tool);
        mapChilds && mapChilds(handle, freeHandle);
    }
    return schemeTools;
}

function mergeToolCollections(scheme: VectorDrawData, image: VectorDrawData) {
    const keys: (keyof ToolData)[] = ["brushes", "pens", "bitmaps", "doubleBitmaps", "texts", "fonts", "strings"];
    for (const k of keys) {
        const parentTools = scheme[k];
        const childTools = image[k];
        if (!childTools) continue;
        if (!parentTools) {
            (<typeof childTools>scheme[k]) = childTools;
            continue;
        }
        if (parentTools == childTools) continue;
        mergeTools(parentTools, childTools, selectToolHandleMapper(image, k));
    }
}

export function replaceIcon(scheme: VectorDrawData, groupHandle: number, iconRef: string, iconIndex: number) {
    if (!scheme.elements) return;
    const parentGroup = scheme.elements.get(groupHandle);
    if (!parentGroup || parentGroup.type != "group") throw new Error(`Нет группы ${groupHandle}`);
    const stubIconHandle = parentGroup.childHandles[0];
    const stubIcon = scheme.elements.get(stubIconHandle);
    if (!stubIcon || stubIcon.type != "doubleBitmap") return;
    const bmp: BitmapRefTool = { type: "bitmapRef", filename: iconRef };
    let freeHandle = 0;
    // if (scheme.doubleBitmaps) {
    while (scheme.doubleBitmaps!.has(++freeHandle));
    // } else {
    //     scheme.doubleBitmaps = new Map();
    //     freeHandle = 1;
    // }
    scheme.doubleBitmaps!.set(freeHandle, bmp);
    stubIcon.data.sourceHandle = freeHandle;
}

/**
 * Вставляет изображение `image` дочернего имиджа в группу `intoGroup` на схеме `scheme` со смещением `offset`
 * @param scheme схема имиджа
 * @param image изображение дочернего имиджа
 * @param intoGroup handle группы на схеме, в которую будут добавлены дочерние элементы
 * @param offset смещение изображения
 */
export function insertImage(
    scheme: VectorDrawData,
    image: VectorDrawData,
    intoGroup: number,
    offset: { x: number; y: number }
) {
    mergeToolCollections(scheme, image);
    const { elements: schemeElements, elementOrder: schemeElementOrder } = scheme;
    const { elements: imageElements, elementOrder: imageElementOrder } = image;
    if (
        !schemeElements ||
        !imageElements ||
        !imageElementOrder ||
        !schemeElementOrder ||
        schemeElements.size == 0 ||
        imageElements.size == 0
    )
        return;

    const parentGroup = schemeElements.get(intoGroup);
    if (!parentGroup || parentGroup.type != "group") throw new Error(`Нет группы ${intoGroup}`);
    const stubIconHandle = hideStubIcon(schemeElements, parentGroup);

    const correctOffset = { x: offset.x - image.origin.x, y: offset.y - image.origin.y };
    const { freeHandle, childOrder } = insertChilds(schemeElements, imageElements, imageElementOrder, correctOffset);
    parentGroup.childHandles.push(freeHandle);

    const newElementOrder: number[] = [];
    schemeElementOrder.forEach(handle => {
        if (handle != stubIconHandle) newElementOrder.push(handle);
        else childOrder.forEach(chldH => newElementOrder.push(chldH));
    });
    scheme.elementOrder = newElementOrder;
}
