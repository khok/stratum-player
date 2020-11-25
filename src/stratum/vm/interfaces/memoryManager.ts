import { VarType } from "stratum/fileFormats/cls";

export interface MemoryManager {
    oldDoubleValues: Float64Array; //<- заменить на 32, мб быстрее будет бегать. в контексте тоже.
    newDoubleValues: Float64Array;

    oldLongValues: Int32Array;
    newLongValues: Int32Array;

    oldStringValues: string[];
    newStringValues: string[];

    getOldValues(type: VarType): Float64Array | Int32Array | string[];
    getNewValues(type: VarType): Float64Array | Int32Array | string[];
}
