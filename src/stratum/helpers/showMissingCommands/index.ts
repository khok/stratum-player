import { ClassData } from "data-types-base";
import { ParsedCode, Operation } from "vm-types";
import { Opcode } from "~/helpers/vmConstants";
import { realCommandNames } from "./realCommandNames";

function cmdHasError(cmd: Function) {
    try {
        cmd();
    } catch (e) {
        if (typeof e === "string") {
            return true;
        }
    }
    return false;
}

function searchErrors({ code }: ParsedCode, operations: Operation[]) {
    const ops = new Set<number>();
    for (let i = 0; i < code.length; i++) {
        const opcode = code[i] & 2047;
        if (!Opcode[opcode] && ((opcode >= 900 && opcode <= 1100) || (opcode >= 1200 && opcode <= 1500)))
            return { error: true, message: "функции 3D движка не реализованы" };
        if (!Opcode[opcode]) return { error: true, message: `Неизвестный опкод: ${opcode}` };
        if (!operations[opcode] || cmdHasError(operations[opcode])) ops.add(opcode);
    }
    return ops.size > 0 ? { error: true, ops } : { error: false };
}

/**
 * Анализирует библиотеку классов `allClasses` на наличие ошибок и нереализованных функций ВМ.
 * Возвращает: `errors` - список причин, по которым проект не может быть запущен.
 * `missingOperations` - отсутствующие команды.
 */

export function formatMissingCommands(missingOperations: { name: string; classNames: string[] }[]) {
    return (
        `Нереализованные операции (всего ${missingOperations.length})\n` +
        missingOperations.map(({ name, classNames }) => `${name} в ${classNames}`).join(";\n")
    );
}

export function showMissingCommands(allClasses: Map<string, ClassData>, operations: Operation[]) {
    const theOps = new Map<number, Set<string>>();
    const errors: string[] = [];
    for (const [name, c] of allClasses) {
        if (!c.bytecode || !c.bytecode.parsed) continue;
        const res = searchErrors(c.bytecode.parsed, operations);
        if (!res.error) continue;
        if (res.ops === undefined) {
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
            name: (realCommandNames[opc] ? realCommandNames[opc] : opc) + ` (${Opcode[opc]})`,
            classNames: [...set.values()],
        });
    return { missingOperations, errors };
}
