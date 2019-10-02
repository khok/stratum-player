import { ClassData } from "../core/types";
import { Opcode } from "../vm/opcode";
import { operations } from "../vm/operations";
import { Bytecode } from "../vm/types";
import { realCommandNames } from "./commands";

function cmdHasError(cmd: any) {
    try {
        cmd();
    } catch (e) {
        if (typeof e === "string") {
            return true;
        }
    }
    return false;
}

function showCmds({ code }: Bytecode) {
    const ops = new Set<number>();
    for (let i = 0; i < code.length; i++) {
        const opcode = code[i] & 2047;
        if (!Opcode[opcode] && ((opcode >= 900 && opcode <= 1100) || (opcode >= 1200 && opcode <= 1500)))
            // console.warn();
            return { error: true, message: "функции 3D движка не реализованы" };
        if (!Opcode[opcode]) return { error: true, message: `Неизвестный опкод: ${opcode}` };
        if (!operations[opcode] || cmdHasError(operations[opcode])) ops.add(opcode);
    }
    if (ops.size > 0) return { error: true, ops };
    return { error: false };
}

export function showMissingCommands(allClasses: Map<string, ClassData>) {
    const theOps = new Map<number, Set<string>>();
    const messages: string[] = [];
    for (const [name, c] of allClasses)
        if (c.bytecode) {
            const res = showCmds(c.bytecode);
            if (res.error) {
                if (res.ops != undefined) {
                    for (const opcode of res.ops) {
                        const set = theOps.get(opcode);
                        if (set) set.add(name);
                        else theOps.set(opcode, new Set([name]));
                    }
                } else {
                    messages.push(`${name} : ${res.message}`);
                }
            }
        }
    const missingOperations: { name: string; classNames: string[] }[] = [];
    for (const [opc, set] of theOps)
        missingOperations.push({
            name: (realCommandNames[opc] ? realCommandNames[opc].name : opc) + ` (${Opcode[opc]})`,
            classNames: [...set.values()]
        });
    return { missingOperations, messages };
}
