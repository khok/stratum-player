import { ClassData } from "data-types-base";
import { Opcode } from "./vmConstants";
import { ParsedCode } from "vm-types";

export function printBytecode(kl: ClassData, code: ParsedCode) {
    code.code.forEach((c, i) => {
        const op = c & 2047;
        const arg =
            c & 2048
                ? c & 4096
                    ? "-> " + kl.vars![code.numberOperands[i]].name
                    : code.numberOperands[i]
                : code.stringOperands[i] !== undefined
                ? `"${code.stringOperands[i]}"`
                : "";
        console.log(`${i}: ${Opcode[op]} ${arg}`);
    });
}

export function rapidBytecodePrint(name: string, collection: Map<string, ClassData>) {
    const kl = collection.get(name)!;
    const code = kl.bytecode!.parsed!;
    printBytecode(kl, code);
}
