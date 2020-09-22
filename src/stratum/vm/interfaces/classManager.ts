import { ComputableClass } from "./computableClass";

/**
 * Осуществляет общие операции над множеством всех имиджей
 * (например, выбор всех имиджей по имени прототипа).
 */
export interface ClassManager {
    getClassesByProtoName(className: string): ComputableClass[];
}
