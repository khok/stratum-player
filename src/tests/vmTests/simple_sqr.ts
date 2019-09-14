import { readClassData, readClassHeaderData } from "../../fileReader/deserialization/classFile";
import { openStreamFromUrl } from "../../fileReader/zipReader";
import { ClassInstance } from "../../classInstance";
import { VirtualMachine } from "../../vm/virtualMachine";

(async function() {
    const stream = await openStreamFromUrl("projects/sqr_norm/Stra8883.CLS");
    // const stream = await openStreamFromUrl("projects/some/New_3648.cls");
    const { version, name } = readClassHeaderData(stream);
    const data = readClassData(stream, version, { parseBytecode: true });
    console.dir(data);
    const ci = new ClassInstance(name, data);
    console.dir(ci);

    console.log("x1: -2.5+i1.32288");
    console.log("x2: -2.5-i1.32288");

    const vm = new VirtualMachine(<any>{}, <any>{}, <any>{});

    //Есть два способа вычислить класс:
    //vm.compute(data.bytecode!, ci); //1
    ci.compute(vm); // 2

    console.log((<any>ci).varValues);
})();
