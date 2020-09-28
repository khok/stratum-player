import { VarCode } from "stratum/common/varCode";

export interface MemoryManager {
    oldDoubleValues: Float64Array; //<- заменить на 32, мб быстрее будет бегать. в контексте тоже.
    newDoubleValues: Float64Array;

    oldLongValues: Int32Array;
    newLongValues: Int32Array;

    oldStringValues: string[];
    newStringValues: string[];

    getOldValues(type: VarCode): Float64Array | Int32Array | string[];
    getNewValues(type: VarCode): Float64Array | Int32Array | string[];
}
