import { MemoryState } from "vm-interfaces-base";

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

        this.defaultStringValues = new Array<string>(stringVarCount);
        this.oldStringValues = new Array<string>(stringVarCount);
        this.newStringValues = new Array<string>(stringVarCount);
    }

    // assertDefaultValuesInitialized() {
    //     for (let i = 0; i < this.defaultVars.length; i++)
    //         if (this.defaultVars[i] === undefined) throw new Error(`Переменная ${i} не инициализирована`);
    // }
    // isValueInitialized(id: number) {
    //     //TODO: сделать лучше
    //     return this.defaultVars[id] !== undefined;
    // }

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
            this.oldStringValues[0] !== undefined ||
            this.newStringValues[0] !== undefined
        )
            throw new Error("Было изменено зарезервированное значение переменной");
    }

    // //FLOATS
    // setDefaultDoubleValue(id: number, value: number): void {
    //     this.defaultDoubleVars[id] = value;
    // }
    // getDefaultDoubleValue(id: number): number {
    //     return this.defaultDoubleVars[id];
    // }

    // setNewDoubleValue(id: number, value: number): void {
    //     this.newDoubleVars[id] = value;
    // }
    // getNewDoubleValue(id: number): number {
    //     return this.newDoubleVars[id];
    // }

    // setOldDoubleValue(id: number, value: number): void {
    //     this.oldDoubleVars[id] = value;
    // }
    // getOldDoubleValue(id: number): number {
    //     return this.oldDoubleVars[id];
    // }

    // //LONGS
    // setDefaultLongValue(id: number, value: number): void {
    //     this.defaultLongVars[id] = value;
    // }
    // getDefaultLongValue(id: number): number {
    //     return this.defaultLongVars[id];
    // }

    // setNewLongValue(id: number, value: number): void {
    //     this.newLongVars[id] = value;
    // }
    // getNewLongValue(id: number): number {
    //     return this.newLongVars[id];
    // }

    // setOldLongValue(id: number, value: number): void {
    //     this.oldLongVars[id] = value;
    // }
    // getOldLongValue(id: number): number {
    //     return this.oldLongVars[id];
    // }

    // //STRINGS
    // setDefaultStringValue(id: number, value: string): void {
    //     this.defaultStringVars[id] = value;
    // }
    // getDefaultStringValue(id: number): string {
    //     return this.defaultStringVars[id];
    // }

    // setNewStringValue(id: number, value: string): void {
    //     this.newStringVars[id] = value;
    // }
    // getNewStringValue(id: number): string {
    //     return this.newStringVars[id];
    // }

    // setOldStringValue(id: number, value: string): void {
    //     this.oldStringVars[id] = value;
    // }
    // getOldStringValue(id: number): string {
    //     return this.oldStringVars[id];
    // }
}
