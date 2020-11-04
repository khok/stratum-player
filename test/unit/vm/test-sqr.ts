import { ClassProto } from "stratum/common/classProto";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { Schema } from "stratum/schema/schema";
import { ExecutionContext } from "stratum/vm/executionContext";
import { parseBytecode } from "stratum/vm/parseBytecode";
const { strictEqual } = chai.assert;

it("Тест квадратного уравнения", async () => {
    const f = await fetch("/projects/other/square_eq.cls").then((b) => b.arrayBuffer());
    const node = new Schema({ proto: new ClassProto(new BinaryStream(f), parseBytecode) });
    const mmanager = node.createMemoryManager();

    const varCount = mmanager.newDoubleValues.length + mmanager.newLongValues.length + mmanager.newStringValues.length - 3;
    strictEqual(varCount, node.vars!.globalIds.length);

    const vm = new ExecutionContext({
        memoryManager: mmanager,
        classManager: <any>{},
        projectManager: <any>{},
        windows: <any>{},
    });

    mmanager.init();
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

    mmanager.init();
    node.compute(vm);
    strictEqual(mmanager.newDoubleValues[node.vars!.globalIds[0]], 60);
    strictEqual(mmanager.newDoubleValues[node.vars!.globalIds[1]], 10);
    strictEqual(mmanager.newStringValues[node.vars!.globalIds[2]], "60");
    strictEqual(mmanager.newStringValues[node.vars!.globalIds[3]], "10");
});
