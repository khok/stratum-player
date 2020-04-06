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
        globalIndexMap: Array.from({ length: vars!.length }, (_, i) => i + 100),
    });
    const mmanager = new MemoryManager(vars!.length + 100);
    node.initDefaultValuesRecursive(mmanager);
    mmanager.initValues();

    const vm = new VmContext(<any>{}, <any>{}, <any>{});
    node.computeSchemeRecursive(vm);
    equal(node.getNewVarValue(2), "-0.4+i1.2");
    equal(node.getNewVarValue(3), "-0.4-i1.2");
    equal(node.getNewVarValue(2), mmanager.getNewVarValue(102));
    equal(node.getNewVarValue(3), mmanager.getNewVarValue(103));

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
    equal(node.getNewVarValue(0), 60);
    equal(node.getNewVarValue(1), 10);
    equal(node.getNewVarValue(2), "60");
    equal(node.getNewVarValue(3), "10");
    console.log("Sqr test successful");
})();
