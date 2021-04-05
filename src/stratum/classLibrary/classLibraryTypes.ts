import { ModelLibrary } from "stratum/compiler";
import { ClassChildInfo, ClassLinkInfo } from "stratum/fileFormats/cls";
import { ClassProto } from "./classProto";

export interface ClassFactory<T> {
    (proto: ClassProto, children: T[], links: ClassLinkInfo[], placement?: ClassChildInfo): T;
}

export interface ClassLibrary extends ModelLibrary /* extends Iterable<ClassProto>*/ {
    has(className: string): boolean;
    get(className: string): ClassProto | null;
    getDirectory(className: string): string | null;
    getFileName(className: string): string | null;
    // getComposedScheme(className: string): VectorDrawing | null;
}
