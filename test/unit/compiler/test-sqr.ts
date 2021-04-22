import { SimpleLibrary } from "stratum/classLibrary/simpleLibrary";
import { Enviroment } from "stratum/enviroment";
import { readClsFile } from "stratum/fileFormats/cls";
import { BinaryReader } from "stratum/helpers/binaryReader";
import { Project } from "stratum/project";
import { PathInfo } from "stratum/stratum";

const { strictEqual } = chai.assert;

// const arch = await fetch("/data/library.zip")
//     .then((res) => res.blob())
//     .then(unzip)
//     .then((fs) => Promise.all([...fs.search(/.+\.cls$/i)].map((f) => f.arraybuffer())))
//     .then((bufs) => bufs.map((b) => new ClassProto(new BinaryStream(b))));
// const proto = arch.find((cl) => cl.name.toUpperCase() === "DRAGOBJECTS")!;

it("Тест квадратного уравнения", async () => {
    const data = await fetch("/projects/other/square_eq.cls").then((b) => b.arrayBuffer());
    const info = readClsFile(new BinaryReader(data));
    const classes = new SimpleLibrary([info]);
    let prj = new Project({} as Enviroment, {
        dir: {} as PathInfo,
        classes,
        prjInfo: { rootClassName: info.name },
    });

    const varCount = prj.newFloats.length + prj.newInts.length + prj.newStrings.length - 3;
    strictEqual(varCount, info.vars!.length);

    let node = prj.root;
    node.compute();

    strictEqual(prj.newStrings[node["TLB"][2]], "-0.4+i1.2");
    strictEqual(prj.newStrings[node["TLB"][3]], "-0.4-i1.2");

    prj = new Project({} as Enviroment, {
        dir: {} as PathInfo,
        classes,
        prjInfo: { rootClassName: info.name },
        stt: {
            childSets: [],
            classId: 0,
            handle: 0,
            classname: node.proto.name,
            values: [
                { name: "a", value: "1" },
                { name: "b", value: "-70" },
                { name: "c", value: "600" },
            ],
        },
    });

    node = prj.root;
    node.compute();
    strictEqual(prj.newFloats[node["TLB"][0]], 60);
    strictEqual(prj.newFloats[node["TLB"][1]], 10);
    strictEqual(prj.newStrings[node["TLB"][2]], "60");
    strictEqual(prj.newStrings[node["TLB"][3]], "10");
});
