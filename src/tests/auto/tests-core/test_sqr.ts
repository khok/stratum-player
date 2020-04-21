import { equal } from "assert";
import { ClassPrototype } from "~/core/classPrototype";
import { ClassSchemeNode } from "~/core/classSchemeNode";
import { MemoryManager } from "~/core/memoryManager";
import { readClassBodyData, readClassHeaderData } from "~/fileReader/deserialization";
import { openStreamFromUrl } from "~/fileReader/fileReaderHelpers";
import { VmContext } from "~/vm/vmContext";

(async function () {
    const stream = await openStreamFromUrl("test_projects/other/square_eq.cls");
    const header = readClassHeaderData(stream);
    const { vars, bytecode } = readClassBodyData(stream, { ...header, fileName: "" }, { parseBytecode: true });

    const node = new ClassSchemeNode({
        proto: new ClassPrototype(name, { vars, code: bytecode!.parsed }),
        // varIndexMap: Array.from({ length: vars!.length }, (_, i) => i + 100),
        varIndexMap: vars!.map((v, i) => ({ type: v.type, globalIdx: i + 100 })),
    });
    const vcount = vars!.length + 100;
    const mmanager = new MemoryManager({ doubleVarCount: vcount, stringVarCount: vcount, longVarCount: vcount });
    node.initDefaultValuesRecursive(mmanager);
    mmanager.initValues();

    const vm = new VmContext({
        memoryState: mmanager,
        project: <any>{},
        graphics: <any>{},
    });
    node.computeSchemeRecursive(vm);
    equal(mmanager.newStringValues[node.stringVarMappingArray![2]], "-0.4+i1.2");
    equal(mmanager.newStringValues[node.stringVarMappingArray![3]], "-0.4-i1.2");
    equal(mmanager.newDoubleValues[node.doubleVarMappingArray![2]], mmanager.newDoubleValues[102]);
    equal(mmanager.newDoubleValues[node.doubleVarMappingArray![3]], mmanager.newDoubleValues[103]);

    node.applyVarSetRecursive({
        childSets: [],
        classId: 0,
        classname: name,
        handle: 0,
        varData: [
            { name: "a", value: "1" },
            { name: "b", value: "-70" },
            { name: "c", value: "600" },
        ],
    });
    mmanager.initValues();

    node.computeSchemeRecursive(vm);
    equal(mmanager.newDoubleValues[node.doubleVarMappingArray![0]], 60);
    equal(mmanager.newDoubleValues[node.doubleVarMappingArray![1]], 10);
    equal(mmanager.newStringValues[node.stringVarMappingArray![2]], "60");
    equal(mmanager.newStringValues[node.stringVarMappingArray![3]], "10");
    console.log("Sqr test successful");
})();
