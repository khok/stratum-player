import { setLogLevel, unzip } from "stratum/api";
import { ClassProto } from "stratum/common/classProto";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { unreleasedFunctions } from "stratum/translator/translator";
import { VFSFile } from "stratum/vfs";

export async function compileLib() {
    setLogLevel("full");
    // const f = await fetch("/projects/other/MyUg2652.cls").then((b) => b.arrayBuffer());
    // const pr = new ClassProto(new BinaryStream(f));
    // console.dir(pr["body"]);
    // return;
    //prettier-ignore
    //Подгруаем архивчики
    const fs = await fetch("/projects/library.zip").then((r) => r.blob()).then(unzip);
    const cll = await Promise.all([...fs.files(/.+\.cls$/i)].map((f) => (f as VFSFile).readAs("cls")));
    const st = 0;
    cll.slice(st, st + 3000).map((c, i) => {
        console.log(st + i);
        !["BYTE", "FLOAT", "INTEGER", "STRING", "WORD", "mousepen", "sliderH", "AnswerControl", "MyUgol", "gruzi"].includes(c.name) && c.model;
    });
    console.log(`${[...unreleasedFunctions.values()].sort().join("\n")}\n${unreleasedFunctions.size}`);
    // const c = cll.find((c) => c.name === "DialogBox")!;
    // console.log(c["body"]["sourceCode"]);
    // console.log(c["body"].vars);
    // console.log(c.model);
    console.log("ура");
    return;
}
