import { MutableStratumScheme, StratumImage } from "./deserializers";
import {
    GraphicElement2D,
    MutableGroup,
    MutableGraphicElement,
    GraphicElement,
    Group
} from "./deserializers/graphicElements";

function elementInGroup(elements: Map<number, GraphicElement>, handle: number) {
    const iterator = elements.values();
    for (let iter = iterator.next(); !iter.done; iter = iterator.next())
        if (iter.value.type == "group" && iter.value.items.includes(handle)) return true;
    return false;
}

function moveChilds(
    parentElements: Map<number, GraphicElement>,
    childElements: Map<number, GraphicElement>,
    childElementOrder: readonly number[],
    offset: { x: number; y: number }
) {
    const iterator = childElements.entries();
    const newHandleMap = new Map<number, number>();
    let freeHandle = 0;
    const newGroupHandles = [];
    for (let iter = iterator.next(); !iter.done; iter = iterator.next()) {
        const [handle, element] = iter.value;
        while (parentElements.has(++freeHandle));
        newHandleMap.set(handle, freeHandle);
        if (!elementInGroup(childElements, handle)) newGroupHandles.push(freeHandle);
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
        parentElements.set(freeHandle, newElement);
    }
    if (childElements.size == 1) return { freeHandle, childOrder: [freeHandle] };
    const newGroup: Group = {
        type: "group",
        items: newGroupHandles,
        options: 0,
        name: ""
    };
    while (parentElements.has(++freeHandle));
    parentElements.set(freeHandle, newGroup);
    // console.log(`Группа ${freeHandle}, элементы: ${newGroupHandles}`);
    return { freeHandle, childOrder: childElementOrder.map(h => newHandleMap.get(h)!) };
}

function insertChildInGroup(
    parentElements: Map<number, GraphicElement>,
    childElements: Map<number, GraphicElement>,
    childElementOrder: readonly number[],
    childImageTopLeft: { x: number; y: number },
    groupHandle: number
) {
    // console.dir(parentElements);
    // console.dir(childElements);
    const parentGroup = parentElements.get(groupHandle);
    if (!parentGroup || parentGroup.type != "group") throw new Error(`Нет группы ${groupHandle}`);

    //я уверен, что объект #{stubIconHandle} (иконка) есть на схеме.
    const stubIconHandle = parentGroup.items[0];
    const stubElement = <GraphicElement2D>parentElements.get(stubIconHandle)!;
    (<MutableGraphicElement>stubElement).options = 0x0001; //делаем ему хайден

    const offset = {
        x: stubElement.position.x - childImageTopLeft.x,
        y: stubElement.position.y - childImageTopLeft.y
    };

    const { freeHandle, childOrder } = moveChilds(parentElements, childElements, childElementOrder, offset);

    (<MutableGroup>parentGroup).items.push(freeHandle);
    return { stubIconHandle, childOrder };
}

export default function insertImageOnScheme(scheme: MutableStratumScheme, image: StratumImage, groupHandle: number) {
    if (image.elements.size == 0) return;
    // console.dir(scheme);
    // console.dir(image);
    // console.log(groupHandle);
    const { stubIconHandle, childOrder } = insertChildInGroup(
        scheme.elements,
        image.elements,
        image.elementOrder,
        image.topLeft,
        groupHandle
    );
    const newOrder: number[] = [];
    scheme.elementOrder.forEach(elHandle => {
        if (elHandle == stubIconHandle) childOrder.forEach(el2 => newOrder.push(el2));
        else newOrder.push(elHandle);
    });
    scheme.elementOrder = newOrder;
}
