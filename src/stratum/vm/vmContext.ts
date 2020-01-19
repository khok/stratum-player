import { ClassState, InputSystemController, ProjectController } from "vm-interfaces-base";
import { VmStateContainer, VirtualMachine } from "vm-types";
import { WindowSystemController } from "vm-interfaces-windows";

export class VmContext implements VmStateContainer, VirtualMachine {
    private nextCmdIndex = 0;
    private lastCmdIndex = 0;
    private stackValues = new Array<number | string>(2000);
    private stackPointer = -1;
    private ctxDepth = 0;
    private _stopped = false;
    private _error: string = "";
    private _hasError = false;

    currentClass!: ClassState; //сделаем публичным для чуть быстрого доступа к нему.
    constructor(
        public readonly windows: WindowSystemController,
        public readonly input: InputSystemController,
        public readonly project: ProjectController
    ) {}

    // get currentClass() {
    //     return this._currentClass;
    // }

    get canExecuteClass() {
        //именно такой максимальный уровень вложенности указан в оригинальных исходниках
        return this.ctxDepth < 60;
    }

    setCodeLength(length: number) {
        this.lastCmdIndex = length - 1;
    }

    nextCommandIndex(): number {
        return this.nextCmdIndex++;
    }

    substituteState(newState: ClassState) {
        this.currentClass = newState;
        this.ctxDepth++;
        return this.nextCmdIndex;
    }

    returnState(prevState: ClassState, cmdIndex: number) {
        this.currentClass = prevState;
        this.nextCmdIndex = cmdIndex;
        this.ctxDepth--;
        if (this.ctxDepth === 0) this.stackPointer = -1;
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
        this._error = message + ` (индекс команды: ${this.nextCmdIndex - 1})`;
        this._hasError = true;
        this.jumpTo(this.lastCmdIndex);
    }

    addErrorInfo(message: string) {
        this._error += "\n" + message;
    }

    stackPush(value: string | number) {
        // if (typeof value === "boolean") value = Number(value);
        this.stackValues[++this.stackPointer] = value;
    }
    stackPop() {
        //Это условие следует вырезать в продакшене
        if (this.stackPointer < 0) throw Error("В стеке нет значений");
        return this.stackValues[this.stackPointer--];
    }
    jumpTo(index: number) {
        this.nextCmdIndex = index;
    }
}
