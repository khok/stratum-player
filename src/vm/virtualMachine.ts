import { IClassInstance, IInputSystem, IProject, IVirtualMachine, IWindowSystem, Opcode } from ".";
import { VmCode } from "../deserializers/vmCode";
import { commands } from "./commands";

type Context = { classInstance: IClassInstance; cmdIndex: number };

export default class VirtualMachine implements IVirtualMachine {
    // private ctxStack = new Array<Context>(60);
    private depth = 0;
    private currentCtx?: Context;

    constructor(
        public readonly windows: IWindowSystem,
        public readonly input: IInputSystem,
        public readonly project: IProject
    ) {}

    get currentClass() {
        return this.currentCtx!.classInstance;
    }

    reset() {
        if (this.depth != 0) throw new Error("wtf???");
        this.valueP = -1;
    }

    get canComputeClass() {
        //именно такой максимальный уровень вложенности указан в оригинальных исходниках
        return this.depth < 60;
    }

    computeClass({ operands, code }: VmCode, classInstance: IClassInstance) {
        // if (this.depth > 59) return;
        const prev = this.currentCtx;

        //Стоило бы закешировать этот объект вместо создания, но это уже микрооптимизации
        const ctx = (this.currentCtx = { classInstance, cmdIndex: 0 });
        this.depth++;

        let opcode;
        try {
            //commands[opcode] вызывать тоже сомнительное решение - лучше закешировать команды в code
            while ((opcode = code[ctx.cmdIndex])) {
                // console.log(Opcode[opcode]);
                commands[opcode](this, operands[ctx.cmdIndex++]);
            }
        } catch (e) {
            if (opcode !== undefined) {
                if (!commands[opcode]) console.error(`Команда ${Opcode[opcode]} не реализована`);
                else console.log(`Ошибка в функции ${Opcode[opcode]}`);
            }
            console.dir(this.currentClass);
            throw e;
        }

        this.depth--;
        this.currentCtx = prev;
    }

    private values = new Array<number | string>(2000);
    private valueP = -1;

    stackPush(value: string | number) {
        // if (typeof value === "boolean") value = Number(value);
        this.values[++this.valueP] = value;
    }
    stackPop() {
        //Это условие следует вырезать в продакшене
        if (this.valueP < 0) throw "No values in stack";
        return this.values[this.valueP--];
    }
    jumpTo(index: number) {
        this.currentCtx!.cmdIndex = index;
    }
}

// stackRewind(count: number) {
//     this.stackP -= count;
//     this.rewindPointer = 0;
// }
// stackNext() {
//     return this.stack[this.stackP + this.rewindPointer++];
// }
