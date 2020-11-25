import { ClassProto } from "stratum/common/classProto";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { MemoryManager } from "stratum/player/memoryManager";
import { Schema } from "stratum/schema/schema";
import { Enviroment } from "stratum/translator";
const { strictEqual } = chai.assert;

// const arch = await fetch("/data/library.zip")
//     .then((res) => res.blob())
//     .then(unzip)
//     .then((fs) => Promise.all([...fs.search(/.+\.cls$/i)].map((f) => f.arraybuffer())))
//     .then((bufs) => bufs.map((b) => new ClassProto(new BinaryStream(b))));
// const proto = arch.find((cl) => cl.name.toUpperCase() === "DRAGOBJECTS")!;

it("Тест квадратного уравнения", async () => {
    const f = await fetch("/projects/other/square_eq.cls").then((b) => b.arrayBuffer());
    const proto = new ClassProto(new BinaryStream(f));

    const mem = new MemoryManager();
    const node = new Schema(proto, new Enviroment(mem));
    const sizes = node.createTLB();

    mem.createBuffers(sizes);
    const varCount = mem.newFloats.length + mem.newInts.length + mem.newStrings.length - 3;
    strictEqual(varCount, node.proto.vars!.count);

    node.applyDefaults();
    mem.sync();

    node.compute();
    strictEqual(mem.newStrings[node.TLB[2]], "-0.4+i1.2");
    strictEqual(mem.newStrings[node.TLB[3]], "-0.4-i1.2");

    mem.createBuffers(sizes);
    node.applyDefaults().applyVarSet({
        childSets: [],
        classId: 0,
        handle: 0,
        classname: node.proto.name,
        values: [
            { name: "a", value: "1" },
            { name: "b", value: "-70" },
            { name: "c", value: "600" },
        ],
    });
    mem.sync();

    node.compute();
    strictEqual(mem.newFloats[node.TLB[0]], 60);
    strictEqual(mem.newFloats[node.TLB[1]], 10);
    strictEqual(mem.newStrings[node.TLB[2]], "60");
    strictEqual(mem.newStrings[node.TLB[3]], "10");
});
