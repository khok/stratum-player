import { MemoryState } from "vm-interfaces-core";

export class MemoryManager implements MemoryState {
    defaultDoubleValues: Float64Array;
    oldDoubleValues: Float64Array;
    newDoubleValues: Float64Array;

    defaultLongValues: Int32Array;
    oldLongValues: Int32Array;
    newLongValues: Int32Array;

    defaultStringValues: string[];
    oldStringValues: string[];
    newStringValues: string[];

    constructor({
        stringVarCount,
        longVarCount,
        doubleVarCount,
    }: {
        stringVarCount: number;
        longVarCount: number;
        doubleVarCount: number;
    }) {
        this.defaultDoubleValues = new Float64Array(doubleVarCount);
        this.oldDoubleValues = new Float64Array(doubleVarCount);
        this.newDoubleValues = new Float64Array(doubleVarCount);

        this.defaultLongValues = new Int32Array(longVarCount);
        this.oldLongValues = new Int32Array(longVarCount);
        this.newLongValues = new Int32Array(longVarCount);

        this.defaultStringValues = new Array<string>(stringVarCount).fill("");
        this.oldStringValues = new Array<string>(stringVarCount).fill("");
        this.newStringValues = new Array<string>(stringVarCount).fill("");
    }

    initValues() {
        this.newDoubleValues = this.defaultDoubleValues.slice();
        this.newLongValues = this.defaultLongValues.slice();
        this.newStringValues = this.defaultStringValues.slice();
        this.syncValues();
    }
    syncValues() {
        this.oldDoubleValues = this.newDoubleValues.slice();
        this.oldLongValues = this.newLongValues.slice();
        this.oldStringValues = this.newStringValues.slice();
    }

    assertZeroIndexEmpty() {
        if (
            this.oldDoubleValues[0] !== 0 ||
            this.newDoubleValues[0] !== 0 ||
            this.oldLongValues[0] !== 0 ||
            this.newLongValues[0] !== 0 ||
            this.oldStringValues[0] !== "" ||
            this.newStringValues[0] !== ""
        )
            throw new Error("Было изменено зарезервированное значение переменной");
    }
}
