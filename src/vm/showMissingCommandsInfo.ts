import { VmCode } from "../deserializers/vmCode";
import { commands } from "./commands";
import { Opcode } from ".";
import cmds from "./commandNames";

export function showMissingCommandsInfo(collection: Map<string, { convertedCode?: VmCode }>) {
    let code: VmCode["code"][] = [];
    const cols = collection.values();
    let bb;
    while (!(bb = cols.next()).done) {
        if (!bb.value.convertedCode) continue;
        code.push(bb.value.convertedCode.code);
    }
    return show(code);
}

function show(code: VmCode["code"] | VmCode["code"][]) {
    if (code[0] instanceof Array) {
        code = new Array<number>().concat(...code);
    }

    return Array.from(new Set(code as VmCode["code"]))
        .filter(op => !commands[op])
        .map(op => ({
            opcode: Opcode[op],
            name: cmds[op] && cmds[op]!.name,
            args: cmds[op] && cmds[op]!.args
        }));
}
