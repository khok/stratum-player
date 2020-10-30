import { ClassChild } from "stratum/fileFormats/cls";
import { VectorDrawing } from "stratum/fileFormats/vdr";
import { BadDataError } from "stratum/helpers/errors";
import { ClassProto } from "./classProto";
import { VdrMerger } from "./vdrMerger";

/**
 * Создает и возвращает копию схемы `scheme` родительского имиджа
 * со вставленными изображениями дочерних имиджей.
 * @param scheme Схема родительского имиджа.
 * @param children Информация о дочерних имиджах.
 * @param classes Библиотека имиджей.
 */
export function createComposedScheme(scheme: VectorDrawing, children: ClassChild[], classes: Map<string, ClassProto<unknown>>) {
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
