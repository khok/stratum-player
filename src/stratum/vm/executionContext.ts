import { ClassManager } from "./interfaces/classManager";
import { ComputableClass, ComputableClassVars } from "./interfaces/computableClass";
import { MemoryManager } from "./interfaces/memoryManager";
import { ProjectManager } from "./interfaces/projectManager";
import { WindowsManager } from "./interfaces/windowsManager";

export interface ExecutionContextArgs {
    windows: WindowsManager;
    projectManager: ProjectManager;
    classManager: ClassManager;
    memoryManager: MemoryManager;
}

export class ExecutionContext {
    private floatStack = new Float64Array(2000); //а можно (не стоит) уменьшить точность
    //TODO: использовать единый ArrayBuffer для стека.
    private floatStackPointer = -1;

    private intStack = new Int32Array(2000);
    private intStackPointer = -1;

    private stringStack = new Array<string>(2000);
    private stringStackPointer = -1;

    private ctxDepth = 0;
    private _error: string = "";

    readonly windows: WindowsManager;
    // readonly input: InputSystemController;
    readonly project: ProjectManager;
    readonly classManager: ClassManager;
    readonly memoryManager: MemoryManager;

    nextOpPointer = 0;
    lastOpPointer = 0;

    currentClass!: ComputableClass;
    classVars!: ComputableClassVars;

    hasError = false;
    pausedClass!: ComputableClass;
    pausedOpPointer!: number;

    executionStopped = false;

    constructor({ windows, projectManager, classManager, memoryManager }: ExecutionContextArgs) {
        this.windows = windows;
        // this.input = input;
        this.project = projectManager;
        this.classManager = classManager;
        this.memoryManager = memoryManager;
    }

    get canExecuteClass() {
        //такой максимальный уровень вложенности указан в оригинальных исходниках
        return this.ctxDepth < 60;
    }

    pushClass(newClass: ComputableClass) {
        this.currentClass = newClass;
        this.classVars = newClass.vars!;
        ++this.ctxDepth;
    }

    popClass(prevClass: ComputableClass) {
        if (--this.ctxDepth === 0) {
            this.floatStackPointer = -1;
            this.intStackPointer = -1;
            this.stringStackPointer = -1;
        } else {
            this.currentClass = prevClass;
            this.classVars = prevClass.vars!;
        }
    }

    get error() {
        return this._error;
    }

    setError(message: string) {
        this._error = message;
        this.hasError = true;
        this.executionStopped = true;
        this.pausedOpPointer = this.nextOpPointer;
        this.pausedClass = this.currentClass;
        this.nextOpPointer = this.lastOpPointer;
    }

    addErrorInfo(message: string) {
        this._error += message;
    }

    pushDouble(value: number) {
        this.floatStack[++this.floatStackPointer] = value;
    }

    popDouble(): number {
        if (this.floatStackPointer < 0) throw new Error("В стеке нет значений");
        return this.floatStack[this.floatStackPointer--]; //TODO: префикс.
    }

    pushLong(value: number) {
        this.intStack[++this.intStackPointer] = value;
    }

    popLong(): number {
        if (this.intStackPointer < 0) throw new Error("В стеке нет значений");
        return this.intStack[this.intStackPointer--];
    }

    pushString(value: string) {
        this.stringStack[++this.stringStackPointer] = value;
    }

    popString(): string {
        if (this.stringStackPointer < 0) throw new Error("В стеке нет значений");
        return this.stringStack[this.stringStackPointer--];
    }
}
