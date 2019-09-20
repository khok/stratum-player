import { Element, Group, HandleMap, VectorDrawData } from "./graphics/types";

function isElementInGroup(elements: Map<number, GraphicElement>, handle: number) {
    const iterator = elements.values();
    for (let iter = iterator.next(); !iter.done; iter = iterator.next())
        if (iter.value.type == "group" && iter.value.items.includes(handle)) return true;
    return false;
}

function addImageToScheme(
    schemeElements: HandleMap<Element>,
    childElements: HandleMap<Element>,
    childElementOrder: number[],
    offset: { x: number; y: number }
) {
    const iterator = childElements.entries();
    const newHandleMap = new Map<number, number>();
    let freeHandle = 0;
    const newGroupHandles = [];
    for (let iter = iterator.next(); !iter.done; iter = iterator.next()) {
        const [handle, element] = iter.value;
        while (schemeElements.has(++freeHandle));
        newHandleMap.set(handle, freeHandle);
        if (!isElementInGroup(childElements, handle)) newGroupHandles.push(freeHandle);
        const newElement: GraphicElement =
            element.type == "group"
                ? {
                      ...element,
                      items: element.items.map(h => newHandleMap.get(h)!)
                  }
                : {
                      ...element,
                      position: {
                          x: element.position.x + offset.x,
                          y: element.position.y + offset.y
                      }
                  };
        schemeElements.set(freeHandle, newElement);
    }
    if (childElements.size == 1) return { freeHandle, childOrder: [freeHandle] };
    const newGroup: Group = {
        type: "group",
        items: newGroupHandles,
        options: 0,
        name: ""
    };
    while (schemeElements.has(++freeHandle));
    schemeElements.set(freeHandle, newGroup);
    // console.log(`Группа ${freeHandle}, элементы: ${newGroupHandles}`);
    return { freeHandle, childOrder: childElementOrder.map(h => newHandleMap.get(h)!) };
}

function hideIcon(schemeElements: HandleMap<Element>, group: Group) {
    //я уверен, что объект #{stubIconHandle} (иконка) есть на схеме.
    const stubIconHandle = group.childHandles[0];
    const stubIcon = schemeElements.get(stubIconHandle);
    if (stubIcon) stubIcon.options = 0x0001; //делаем ему хайден
}

/**
 * Вставляет изображение дочернего имиджа на схему
 * @param scheme схема имиджа
 * @param image изображение дочернего имиджа
 * @param groupHandle handle группы на схеме, в которую будут добавлены дочерние элементы
 */
export default function insertImageOnScheme(scheme: VectorDrawData, image: VectorDrawData, groupHandle: number) {
    const { elements: schemeElements } = scheme;
    const { elements: imageElements, elementOrder } = image;
    if (!schemeElements || !imageElements || !elementOrder || schemeElements.size == 0 || imageElements.size == 0)
        return;

    const parentGroup = schemeElements.get(groupHandle);
    if (!parentGroup || parentGroup.type != "group") throw new Error(`Нет группы ${groupHandle}`);
    hideIcon(schemeElements, parentGroup);

    const { stubIconHandle, childOrder };

    const { freeHandle, childOrder } = moveChilds(schemeElements, imageElements, elementOrder, offset);
    (<MutableGroup>parentGroup).items.push(freeHandle);

    const newElementOrder: number[] = [];
    elementOrder.forEach(handle => {
        if (handle != stubIconHandle) newElementOrder.push(handle);
        else childOrder.forEach(chldH => newElementOrder.push(chldH));
    });
    scheme.elementOrder = newElementOrder;
}
