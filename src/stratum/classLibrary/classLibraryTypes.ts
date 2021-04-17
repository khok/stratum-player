import { ModelLibrary } from "stratum/compiler";
import { ClassChildInfo, ClassLinkInfo } from "stratum/fileFormats/cls";
import { ClassProto } from "./classProto";

export interface ClassFactory<T> {
    (proto: ClassProto, children: T[], links: ClassLinkInfo[], placement?: ClassChildInfo): T;
}

/**
 * Библиотека имиджей.
 */
export interface ClassLibrary extends ModelLibrary /* extends Iterable<ClassProto>*/ {
    /**
     * Существует ли имидж с указанными именем?
     */
    has(className: string): boolean;
    /**
     * Возвращает имидж с указанными именем.
     */
    get(className: string): ClassProto | null;
    /**
     * Возвращает полный путь к файлу имиджа.
     */
    getPath(className: string): string | null;
}
