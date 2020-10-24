import { ClassPrototype } from "stratum/common/classPrototype";
import { OpCode } from "../consts";
import { OPCODE_MASK } from "../consts/operandFlagMasks";
import { operations } from "../operations";
import { Operation, ParsedCode } from "../types";
import realCommandNames from "./realCommandNames.json";

function cmdHasError(cmd: Function) {
    try {
        cmd();
    } catch (e) {
        if (typeof e === "string") return true;
    }
    return false;
}

function searchErrors({ code }: ParsedCode, operations: Operation[]) {
    const ops = new Set<number>();
    for (let i = 0; i < code.length; i++) {
        const opcode = code[i] & OPCODE_MASK;
        if (opcode === 0) continue;
        if (!OpCode[opcode] && ((opcode >= 900 && opcode <= 1100) || (opcode >= 1200 && opcode <= 1500)))
            return { error: true, message: "функции 3D движка не реализованы" };
        if (!OpCode[opcode]) return { error: true, message: `Неизвестный опкод: ${opcode}` };
        if (!operations[opcode] || cmdHasError(operations[opcode])) ops.add(opcode);
    }
    return ops.size > 0 ? { error: true, ops } : { error: false };
}

/**
 * Анализирует библиотеку имиджей на наличие ошибок и нереализованных функций ВМ.
 * Возвращает: `errors` - список причин, по которым проект не может быть запущен.
 * `missingOperations` - отсутствующие команды.
 */

export function formatMissingCommands(missingOperations: { name: string; classNames: string[] }[]) {
    return (
        `Нереализованные операции (всего ${missingOperations.length})\n` +
        missingOperations.map(({ name, classNames }) => `${name} в ${classNames}`).join(";\n")
    );
}

export function findMissingCommands(classes: Map<string, ClassPrototype<ParsedCode>>) {
    const theOps = new Map<number, Set<string>>();
    const errors: string[] = [];
    for (const [name, c] of classes) {
        if (!c.code) continue;
        const res = searchErrors(c.code, operations);
        if (!res.error) continue;
        if (!res.ops) {
            errors.push(`${name} : ${res.message}`);
        } else {
            for (const opcode of res.ops) {
                const set = theOps.get(opcode);
                if (set) set.add(name);
                else theOps.set(opcode, new Set([name]));
            }
        }
    }
    const missingOperations: { name: string; classNames: string[] }[] = [];
    for (const [opc, set] of theOps)
        missingOperations.push({
            name: (realCommandNames[opc] ? realCommandNames[opc] : opc) + ` (${OpCode[opc]})`,
            classNames: [...set.values()],
        });
    return { missingOperations, errors };
}

// Рекурсивно ищет используемые в проекте классы и возвращает их ошибки.
// В большинстве проектов эта функция - лучший вариант их поиска.
// В проектах, где классы подгружаются динамически - нет.
export function findMissingCommandsRecursive(rootName: string, classes: Map<string, ClassPrototype<ParsedCode>>) {
    const targetClasses = new Map<string, ClassPrototype<ParsedCode>>();
    (function collect(clName: string) {
        const key = clName.toLowerCase();
        const root = classes.get(key);
        if (!root) throw new Error(`Имимдж ${clName} не существует.`);
        targetClasses.set(key, root);
        if (root.children) root.children.forEach((c) => collect(c.classname));
    })(rootName);
    return findMissingCommands(targetClasses);
}
