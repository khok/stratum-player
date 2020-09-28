import { strictEqual } from "assert";
import { TreeNode } from "/classTree/treeNode";
import { VirtualFile } from "/common/virtualFileSystem";
import { ClassPrototype } from "/common/classPrototype";
import { ExecutionContext } from "/vm/executionContext";
import { parseBytecode } from "/vm/parseBytecode";

(async function () {
    const stream = await VirtualFile.fromUrl("/test_projects/other/square_eq.cls").openStream();

    const node = new TreeNode({ proto: new ClassPrototype(stream, parseBytecode) });
    const mmanager = node.createMemoryManager();

    const varCount = mmanager.newDoubleValues.length + mmanager.newLongValues.length + mmanager.newStringValues.length - 3;
    strictEqual(varCount, node.vars!.globalIds.length);

    const vm = new ExecutionContext({
        memoryManager: mmanager,
        classManager: <any>{},
        projectManager: <any>{},
        windows: <any>{},
    });

    mmanager.initValues();
    node.compute(vm);
    strictEqual(mmanager.newStringValues[node.vars!.globalIds[2]], "-0.4+i1.2");
    strictEqual(mmanager.newStringValues[node.vars!.globalIds[3]], "-0.4-i1.2");

    node.applyVarSet({
        childSets: [],
        classId: 0,
        handle: 0,
        classname: node.protoName,
        values: [
            { name: "a", value: "1" },
            { name: "b", value: "-70" },
            { name: "c", value: "600" },
        ],
    });

    mmanager.initValues();
    node.compute(vm);
    strictEqual(mmanager.newDoubleValues[node.vars!.globalIds[0]], 60);
    strictEqual(mmanager.newDoubleValues[node.vars!.globalIds[1]], 10);
    strictEqual(mmanager.newStringValues[node.vars!.globalIds[2]], "60");
    strictEqual(mmanager.newStringValues[node.vars!.globalIds[3]], "10");
    console.log("Sqr test completed.");
})();
