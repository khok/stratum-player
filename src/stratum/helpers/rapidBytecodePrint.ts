import { ClassData } from "data-types-base";
import { Opcode } from "./vmConstants";

export function rapidBytecodePrint(name: string, collection: Map<string, ClassData>) {
    const kl = collection.get(name)!;
    const code = kl.bytecode!.parsed!;
    code.code.forEach((c, i) => {
        const op = c & 2047;
        const arg =
            c & 16384
                ? c & 8192
                    ? kl.vars![code.numberOperands[i]].name
                    : code.numberOperands[i]
                : code.stringOperands[i]
                ? `"${code.stringOperands[i]}"`
                : "";
        console.log(`${i}: ${Opcode[op]} ${arg}`);
    });
}
