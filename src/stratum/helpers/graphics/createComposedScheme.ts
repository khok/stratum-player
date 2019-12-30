import { ChildData, ClassData } from "data-types-base";
import { VectorDrawData } from "data-types-graphics";
import { VdrMerger } from "./vdrMerger";

export function createComposedScheme(scheme: VectorDrawData, childs: ChildData[], collection: Map<string, ClassData>) {
    const merger = new VdrMerger(scheme);
    for (const childInfo of childs) {
        const childClassData = collection.get(childInfo.classname)!;
        const { handle: rootGroupHandle, position } = childInfo;
        if (childClassData.iconRef) merger.replaceIcon(rootGroupHandle, childClassData.iconRef);
        if (childClassData.image) merger.insertChildImage(rootGroupHandle, childClassData.image, position);
    }
    return merger.data;
}
