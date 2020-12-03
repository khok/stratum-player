import { setLogLevel, unzip } from "stratum/api";
import { unreleasedFunctions } from "stratum/translator/translator";
import { VFSFile } from "stratum/vfs";

export async function compileLib() {
    setLogLevel("full");
    //prettier-ignore
    //Подгруаем архивчики
    const fs = await fetch("/projects/biglib.zip").then((r) => r.blob()).then(unzip);
    const cll = await Promise.all([...fs.files(/.+\.cls$/i)].map((f) => (f as VFSFile).readAs("cls")));
    cll.slice(0).map((c, i) => {
        console.log(i);
        !["BYTE", "FLOAT", "INTEGER", "STRING", "WORD"].includes(c.name) && c.model;
    });
    console.log(`${[...unreleasedFunctions.values()].sort().join("\n")}\n${unreleasedFunctions.size}`);
    // const c = cll.find((c) => c.name === "DialogBox")!;
    // console.log(c["body"]["sourceCode"]);
    // console.log(c["body"].vars);
    // console.log(c.model);
    console.log("ура");
    return;
}
