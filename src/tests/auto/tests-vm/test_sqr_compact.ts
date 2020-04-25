import { equal } from "assert";
import { readClassBodyData, readClassHeaderData } from "~/fileReader/deserialization";
import { openStreamFromUrl } from "~/fileReader/fileReaderHelpers";
import { parseVarValue } from "~/helpers/varValueFunctions";
import { executeCode } from "~/vm/executeCode";
import { VmContext } from "~/vm/vmContext";
import { ClassState } from "vm-interfaces-core";
import { MemoryManager } from "~/core/memoryManager";

(async function () {
    const stream = await openStreamFromUrl("/test_projects/other/square_eq.cls");
    const header = readClassHeaderData(stream);
    const data = readClassBodyData(stream, { ...header, fileName: "" }, { parseBytecode: true });
    const { bytecode, vars } = data;

    const mmanager = new MemoryManager({ stringVarCount: 12, doubleVarCount: 12, longVarCount: 12 });
    mmanager.defaultStringValues.fill("");
    mmanager.oldStringValues.fill("");
    mmanager.oldStringValues.fill("");

    vars!.forEach((v, i) => {
        const val = parseVarValue(v.type, v.defaultValue);
        switch (v.type) {
            case "FLOAT":
                mmanager.defaultDoubleValues[i] = val as number;
                break;
            case "HANDLE":
                mmanager.defaultLongValues[i] = val as number;
                break;
            default:
                mmanager.defaultStringValues[i] = val as string;
                break;
        }
    });
    mmanager.initValues();

    const fill = new Uint16Array(12).map((_, i) => i);

    const cl = <ClassState>{
        longIdToGlobal: fill,
        stringIdToGlobal: fill,
        doubleIdToGlobal: fill,
    };
    const ctx = new VmContext({
        graphics: {} as any,
        project: {} as any,
        memoryState: mmanager,
    });
    ctx.pushClass(cl);
    // printBytecode(data, bytecode!.parsed!);
    executeCode(ctx, bytecode!.parsed!);
    equal(mmanager.newStringValues[2], "-0.4+i1.2");
    equal(mmanager.newStringValues[3], "-0.4-i1.2");
    mmanager.defaultDoubleValues[4] = 1;
    mmanager.defaultDoubleValues[5] = -70;
    mmanager.defaultDoubleValues[6] = 600;
    mmanager.initValues();
    // values[4].old = values[4].new = 1;
    // values[5].old = values[5].new = -70;
    // values[6].old = values[6].new = 600;
    executeCode(ctx, bytecode!.parsed!);
    equal(mmanager.newDoubleValues[0], 60);
    equal(mmanager.newDoubleValues[1], 10);
    equal(mmanager.newStringValues[2], "60");
    equal(mmanager.newStringValues[3], "10");
    console.log("Sqr-compact test completed");
})();
