import { UsageError } from "stratum/common/errors";
import { VarCode } from "stratum/common/varCode";
import { MemoryManager } from "stratum/vm/interfaces/memoryManager";

export interface TreeMemoryManagerArgs {
    floatsCount: number;
    longsCount: number;
    stringsCount: number;
}

export class TreeMemoryManager implements MemoryManager {
    defaultDoubleValues = new Float64Array(0);
    oldDoubleValues = new Float64Array(0);
    newDoubleValues = new Float64Array(0);

    defaultLongValues = new Int32Array(0);
    oldLongValues = new Int32Array(0);
    newLongValues = new Int32Array(0);

    defaultStringValues = new Array<string>();
    oldStringValues = new Array<string>();
    newStringValues = new Array<string>();

    constructor(args?: TreeMemoryManagerArgs) {
        if (args) this.createBuffers(args);
    }

    createBuffers({ floatsCount, longsCount, stringsCount }: TreeMemoryManagerArgs) {
        this.defaultDoubleValues = new Float64Array(floatsCount);
        this.oldDoubleValues = new Float64Array(floatsCount);
        this.newDoubleValues = new Float64Array(floatsCount);

        this.defaultLongValues = new Int32Array(longsCount);
        this.oldLongValues = new Int32Array(longsCount);
        this.newLongValues = new Int32Array(longsCount);

        this.defaultStringValues = new Array<string>(stringsCount).fill("");
        this.oldStringValues = new Array<string>(stringsCount).fill("");
        this.newStringValues = new Array<string>(stringsCount).fill("");
        return this;
    }

    /**
     * Копирует значения по умолчанию в старые и новые.
     */
    initValues() {
        this.newDoubleValues.set(this.defaultDoubleValues);
        this.newLongValues.set(this.defaultLongValues);
        for (let i = 0; i < this.defaultStringValues.length; i++) this.newStringValues[i] = this.defaultStringValues[i];
        this.syncValues();
        return this;
    }

    /**
     * Копирует новые значения переменных в старые.
     */
    syncValues() {
        //TODO: slice -> set - меньше работы GC
        this.oldDoubleValues.set(this.newDoubleValues);
        this.oldLongValues.set(this.newLongValues);
        for (let i = 0; i < this.newStringValues.length; i++) this.oldStringValues[i] = this.newStringValues[i];
        return this;
    }

    /**
     * Проверка, не было ли изменено (в результате багов) зарезервированное значение.
     */
    assertZeroIndexEmpty() {
        if (
            this.oldDoubleValues[0] !== 0 ||
            this.newDoubleValues[0] !== 0 ||
            this.oldLongValues[0] !== 0 ||
            this.newLongValues[0] !== 0 ||
            this.oldStringValues[0] !== "" ||
            this.newStringValues[0] !== ""
        )
            throw new UsageError("Было изменено зарезервированное значение переменной");
    }

    getOldValues(type: VarCode): Float64Array | string[] | Int32Array {
        switch (type) {
            case VarCode.Float:
                return this.oldDoubleValues;
            case VarCode.Handle:
            case VarCode.ColorRef:
                return this.oldLongValues;
            case VarCode.String:
                return this.oldStringValues;
        }
    }

    getNewValues(type: VarCode): Float64Array | string[] | Int32Array {
        switch (type) {
            case VarCode.Float:
                return this.newDoubleValues;
            case VarCode.Handle:
            case VarCode.ColorRef:
                return this.newLongValues;
            case VarCode.String:
                return this.newStringValues;
        }
    }

    getDefaultValues(type: VarCode): Float64Array | string[] | Int32Array {
        switch (type) {
            case VarCode.Float:
                return this.defaultDoubleValues;
            case VarCode.Handle:
            case VarCode.ColorRef:
                return this.defaultLongValues;
            case VarCode.String:
                return this.defaultStringValues;
        }
    }
}
