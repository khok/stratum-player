import { equal } from "assert";
import { readClassData, readClassHeaderData } from "~/fileReader/deserialization";
import { openStreamFromUrl } from "~/fileReader/fileReaderHelpers";
import { parseVarValue } from "~/helpers/varValueFunctions";
import { executeCode } from "~/vm/executeCode";
import { VmContext } from "~/vm/vmContext";
import { ClassState } from "vm-interfaces-base";

(async function () {
    const stream = await openStreamFromUrl("/test_projects/other/square_eq.cls");
    const header = readClassHeaderData(stream);
    const { bytecode, vars } = readClassData(stream, { ...header, fileName: "" }, { parseBytecode: true });
    const values = vars!.map((v) => {
        const val = parseVarValue(v.type, v.defaultValue);
        return { new: val, old: val };
    });
    const cl = <ClassState>{
        setNewVarValue(id, value) {
            values[id].new = value;
        },
        getNewVarValue(id) {
            return values[id].new;
        },
        getOldVarValue(id) {
            return values[id].old;
        },
    };
    const ctx = new VmContext({} as any, {} as any, {} as any);
    ctx.substituteState(cl);
    executeCode(ctx, bytecode!.parsed!);
    equal(cl.getNewVarValue(2), "-0.4+i1.2");
    equal(cl.getNewVarValue(3), "-0.4-i1.2");
    values[4].old = values[4].new = 1;
    values[5].old = values[5].new = -70;
    values[6].old = values[6].new = 600;
    executeCode(ctx, bytecode!.parsed!);
    equal(cl.getNewVarValue(0), 60);
    equal(cl.getNewVarValue(1), 10);
    equal(cl.getNewVarValue(2), "60");
    equal(cl.getNewVarValue(3), "10");
    console.log("Sqr-compact test completed");
})();
