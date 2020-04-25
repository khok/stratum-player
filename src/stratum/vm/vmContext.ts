import { ClassState, ProjectController, MemoryState } from "vm-interfaces-core";
import { VmStateContainer, VirtualMachine } from "vm-types";
import { GraphicSystemController } from "vm-interfaces-graphics";

export interface VmContextData {
    graphics: GraphicSystemController;
    project: ProjectController;
    memoryState: MemoryState;
}

export class VmContext implements VmStateContainer, VirtualMachine {
    nextCmdIndex = 0;
    currentClass!: ClassState; //сделаем публичным для чуть быстрого доступа к нему.

    private codeLength = 0;

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

    readonly graphics: GraphicSystemController;
    // readonly input: InputSystemController;
    readonly project: ProjectController;
    readonly memoryState: MemoryState;

    constructor({ graphics, project, memoryState }: VmContextData) {
        this.graphics = graphics;
        // this.input = input;
        this.project = project;
        this.memoryState = memoryState;
    }

    get canExecuteClass() {
        //такой максимальный уровень вложенности указан в оригинальных исходниках
        return this.ctxDepth < 60;
    }

    setCodeLength(length: number) {
        this.codeLength = length;
    }

    pushClass(newClass: ClassState) {
        this.currentClass = newClass;
        this.ctxDepth++;
        return this.nextCmdIndex;
    }

    popClass(prevClass: ClassState, cmdIndex: number) {
        this.currentClass = prevClass;
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
        this._error = message;
        this._hasError = true;
        this.jumpTo(this.codeLength - 1);
    }

    addErrorInfo(message: string) {
        this._error += message;
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

    jumpTo(index: number) {
        this.nextCmdIndex = index;
    }
}
