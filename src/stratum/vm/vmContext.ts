import { ClassState, InputSystemController, ProjectController, MemoryState } from "vm-interfaces-base";
import { VmStateContainer, VirtualMachine } from "vm-types";
import { WindowSystemController } from "vm-interfaces-windows";

export class VmContext implements VmStateContainer, VirtualMachine {
    public nextCmdIndex = 0;
    private codeLength = 0;
    // private stackValues = new Array<number | string>(2000);
    private floatStack = new Float64Array(2000);
    private floatStackPointer = -1;

    private intStack = new Int32Array(2000);
    private intStackPointer = -1;

    private stringStack = new Array<string>(2000);
    private stringStackPointer = -1;

    private ctxDepth = 0;
    private _stopped = false;
    private _error: string = "";
    private _hasError = false;

    readonly windows: WindowSystemController;
    readonly input: InputSystemController;
    readonly project: ProjectController;
    readonly memoryState: MemoryState;

    currentClass!: ClassState; //сделаем публичным для чуть быстрого доступа к нему.
    constructor({
        windows,
        input,
        project,
        memoryState,
    }: {
        windows: WindowSystemController;
        input: InputSystemController;
        project: ProjectController;
        memoryState: MemoryState;
    }) {
        this.windows = windows;
        this.input = input;
        this.project = project;
        this.memoryState = memoryState;
    }
    // get currentClass() {
    //     return this._currentClass;
    // }

    get canExecuteClass() {
        //именно такой максимальный уровень вложенности указан в оригинальных исходниках
        return this.ctxDepth < 60;
    }

    setCodeLength(length: number) {
        this.codeLength = length;
    }

    // nextCommandIndex(): number {
    //     return this.nextCmdIndex++;
    // }

    substituteState(newState: ClassState) {
        this.currentClass = newState;
        this.ctxDepth++;
        return this.nextCmdIndex;
    }

    returnState(prevState: ClassState, cmdIndex: number) {
        this.currentClass = prevState;
        this.nextCmdIndex = cmdIndex;
        this.ctxDepth--;
        if (this.ctxDepth === 0) {
            this.floatStackPointer = -1;
            this.intStackPointer = -1;
            this.stringStackPointer = -1;
        }
    }

    get error() {
        return this._error;
    }

    get hasError(): boolean {
        return this._hasError;
    }

    get shouldStop(): boolean {
        return this._stopped;
    }

    requestStop() {
        this._stopped = true;
    }

    setError(message: string) {
        this._error = message + ` (индекс опкода: ${this.nextCmdIndex - 1})`;
        this._hasError = true;
        this.jumpTo(this.codeLength - 1);
    }

    addErrorInfo(message: string) {
        this._error += "\n" + message;
    }

    pushDouble(value: number) {
        this.floatStack[++this.floatStackPointer] = value;
    }
    popDouble(): number {
        if (this.floatStackPointer < 0) throw Error("В стеке нет значений");
        return this.floatStack[this.floatStackPointer--];
    }

    pushLong(value: number) {
        this.intStack[++this.intStackPointer] = value;
    }
    popLong(): number {
        if (this.intStackPointer < 0) throw Error("В стеке нет значений");
        return this.intStack[this.intStackPointer--];
    }

    pushString(value: string) {
        this.stringStack[++this.stringStackPointer] = value;
    }
    popString(): string {
        if (this.stringStackPointer < 0) throw Error("В стеке нет значений");
        return this.stringStack[this.stringStackPointer--];
    }

    // stackPush(value: string | number) {
    //     // if (typeof value === "boolean") value = Number(value);
    //     this.stackValues[++this.stackPointer] = value;
    // }
    // stackPop() {
    //     //Это условие следует вырезать в продакшене
    //     if (this.stackPointer < 0) throw Error("В стеке нет значений");
    //     return this.stackValues[this.stackPointer--];
    // }

    jumpTo(index: number) {
        this.nextCmdIndex = index;
    }
}
