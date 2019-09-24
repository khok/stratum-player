import { equal } from "assert";
import { ClassInstance } from "../../core/classInstance";
import { readClassData, readClassHeaderData } from "../../fileReader/deserialization/classFile";
import { openStreamFromUrl } from "../../fileReader/zipReader";
import { createDefaultValue } from "../../helpers";
import { VirtualMachine } from "../../vm/virtualMachine";

(async function() {
    const stream = await openStreamFromUrl("projects/other/square_eq.cls");
    const { version, name } = readClassHeaderData(stream);
    const data = readClassData(stream, version, { parseBytecode: true });

    const ci = new ClassInstance(name, data);
    const allVars = ci.extractVariables();
    allVars.forEach(v => {
        if (v.defaultValue == undefined) v.defaultValue = createDefaultValue(v.type);
        v.newValue = v.oldValue = v.defaultValue;
    });

    const vm = new VirtualMachine(<any>{}, <any>{}, <any>{});

    //Есть два способа вычислить класс:
    // vm.executeCode(data.bytecode!, ci); //1
    ci.computeScheme(vm); // 2
    equal(ci.getNewVarValue(2), "-0.4+i1.2");
    equal(ci.getNewVarValue(3), "-0.4-i1.2");

    ci.applyVariables({
        childSets: [],
        classname: "StratumClass_11202814_a13",
        handle: 0,
        varData: [{ name: "a", data: "1" }, { name: "b", data: "-70" }, { name: "c", data: "600" }]
    });
    allVars.forEach(v => (v.newValue = v.oldValue = v.defaultValue!));

    ci.computeScheme(vm);
    equal(ci.getNewVarValue(0), 60);
    equal(ci.getNewVarValue(1), 10);
    equal(ci.getNewVarValue(2), "60");
    equal(ci.getNewVarValue(3), "10");
    console.log("Sqr test successful");
})();
