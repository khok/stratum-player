import { ChildData, ClassData } from "data-types-base";
import { VectorDrawData } from "data-types-graphics";
import { VdrMerger } from "./vdrMerger";

/**
 * Создает и возвращает копию схемы `scheme` родительского имиджа
 * со вставленными изображениями дочерних имиджей.
 * @param scheme - схема родительского имиджа.
 * @param childs - информация о дочерних классах имиджа.
 * @param collection - библиотека имиджей.
 */
export function createComposedScheme(scheme: VectorDrawData, childs: ChildData[], collection: Map<string, ClassData>) {
    const merger = new VdrMerger(scheme);
    for (const childInfo of childs) {
        const childClassData = collection.get(childInfo.classname)!;
        const { handle: rootGroupHandle, position } = childInfo;
        if (childClassData.iconFile) merger.replaceIcon(rootGroupHandle, childClassData.iconFile);
        if (childClassData.image) merger.insertChildImage(rootGroupHandle, childClassData.image, position);
    }
    return merger.data;
}
