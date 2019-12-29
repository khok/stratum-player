import { ClassState, InputSystemController, ProjectController } from "vm-interfaces-base";
import { VmStateContainer, VirtualMachine } from "vm-types";
import { WindowSystemController } from "vm-interfaces-windows";

export class VmContext implements VmStateContainer, VirtualMachine {
    private currentCmdIndex = 0;
    private ctxDepth = 0;
    private values = new Array<number | string>(2000);
    private valueP = -1;
    private endPoint: number = 0;
    private _currentClass!: ClassState;

    constructor(
        public readonly windows: WindowSystemController,
        public readonly input: InputSystemController,
        public readonly project: ProjectController
    ) {}

    get currentClass() {
        return this._currentClass;
    }

    get canExecuteClass() {
        //именно такой максимальный уровень вложенности указан в оригинальных исходниках
        return this.ctxDepth < 60;
    }

    setCodeLength(length: number) {
        this.endPoint = length - 1;
    }

    nextCommandIndex(): number {
        return this.currentCmdIndex++;
    }

    substituteState(newState: ClassState) {
        this._currentClass = newState;
        this.ctxDepth++;
        return this.currentCmdIndex;
    }

    returnState(prevState: ClassState, cmdIndex: number) {
        this._currentClass = prevState;
        this.currentCmdIndex = cmdIndex;
        this.ctxDepth--;
        if (this.ctxDepth === 0) this.valueP = -1;
    }

    private _error: string = "";
    get error() {
        return this._error;
    }

    setError(message: string) {
        this._error = message + ` (индекс команды: ${this.currentCmdIndex})`;
        this.jumpTo(this.endPoint);
    }

    addErrorInfo(message: string) {
        this._error += "\n" + message;
    }

    stackPush(value: string | number) {
        // if (typeof value === "boolean") value = Number(value);
        this.values[++this.valueP] = value;
    }
    stackPop() {
        //Это условие следует вырезать в продакшене
        if (this.valueP < 0) throw Error("В стеке нет значений");
        return this.values[this.valueP--];
    }
    jumpTo(index: number) {
        this.currentCmdIndex = index;
    }
}
