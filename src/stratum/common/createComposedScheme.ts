import { ClassPrototype } from "./classPrototype";
import { BadDataError } from "./errors";
import { ClassChild } from "./fileFormats/cls";
import { VectorDrawing } from "./fileFormats/vdr/types/vectorDrawing";
import { VdrMerger } from "./vdrMerger";

/**
 * Создает и возвращает копию схемы `scheme` родительского имиджа
 * со вставленными изображениями дочерних имиджей.
 * @param scheme - схема родительского имиджа.
 * @param children - информация о дочерних имиджах.
 * @param classes - библиотека имиджей.
 */
export function createComposedScheme(scheme: VectorDrawing, children: ClassChild[], classes: Map<string, ClassPrototype<unknown>>) {
    const merger = new VdrMerger(scheme);
    for (const child of children) {
        const childClassData = classes.get(child.classname.toLowerCase());
        if (!childClassData) throw new BadDataError(`Подимидж ${child.classname} #${child.schemeInfo.handle} не найден.`);
        const { handle: rootGroupHandle, position } = child.schemeInfo;
        if (childClassData.iconFile) merger.replaceIcon(rootGroupHandle, childClassData.iconFile);
        if (childClassData.image) merger.insertChildImage(rootGroupHandle, childClassData.image, position);
    }
    return merger.result;
}
