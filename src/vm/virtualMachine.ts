import { StratumError } from "../errors";
import { operations } from "./operations";
import { Bytecode, ClassFunctions, InputFunctions, ProjectFunctions, VmContext, WindowingFunctions } from "./types";

export class VirtualMachine implements VmContext {
    // private ctxStack = new Array<Context>(60);
    private depth = 0;

    private values = new Array<number | string>(2000);
    private valueP = -1;

    private cmdIndex = -1;
    currentClass!: ClassFunctions;

    constructor(
        public readonly windows: WindowingFunctions,
        public readonly input: InputFunctions,
        public readonly project: ProjectFunctions
    ) {}

    get canComputeClass() {
        //именно такой максимальный уровень вложенности указан в оригинальных исходниках
        return this.depth < 60;
    }

    //что сделать:
    executeCode({ code, numberOperands, stringOperands, otherOperands }: Bytecode, theClass: ClassFunctions) {
        if (!this.canComputeClass) throw Error("Достигнула макс. вложенность");

        const prevClass = this.currentClass;
        const prevCmdIndex = this.cmdIndex;
        this.currentClass = theClass;
        this.cmdIndex = 0;
        this.depth++;

        // let cmd: { operation: Operation; opcode: number; operand?: Operand } | undefined = undefined;
        let iterCount = 0;

        let cmd;
        let ci = -1;
        while ((cmd = code[(ci = this.cmdIndex++)]) & 2047) {
            iterCount++;
            if (iterCount > 10000) this.error("Число итераций перевалило за 10000");

            const op = operations[cmd & 2047];
            if (cmd < 16384) {
                op(this);
                continue;
            }
            if (cmd < 32768) {
                const oper = numberOperands[ci];
                op(this, oper);
                continue;
            }
            if (cmd < 49152) {
                op(this, stringOperands[ci]);
                continue;
            }
            op(this, otherOperands[ci]);
        }

        this.depth--;
        if (this.depth == 0) this.valueP = -1;
        this.currentClass = prevClass;
        this.cmdIndex = prevCmdIndex;
    }

    error(message = "") {
        console.dir(this.currentClass);
        throw new StratumError("Ошибка в работе виртуальной машины:\n" + message);
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
        this.cmdIndex = index;
    }
}
