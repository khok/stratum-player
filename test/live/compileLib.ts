import { SimpleLibrary } from "stratum/classLibrary/simpleLibrary";
import { unreleasedFunctions } from "stratum/compiler/unreleasedFunctions";
import { Enviroment } from "stratum/enviroment";
import { readClsFile } from "stratum/fileFormats/cls";
import { BinaryReader } from "stratum/helpers/binaryReader";
import { options } from "stratum/options";
import { ZipFS } from "stratum/stratum";
import { RealZipFS } from "zipfs/realZipfs";

export async function compileLib() {
    options.log = () => {};
    // const f = await fetch("/projects/other/MyUg2652.cls").then((b) => b.arrayBuffer());
    // const pr = new ClassProto(new BinaryStream(f));
    // console.dir(pr["body"]);
    // return;
    //prettier-ignore
    //Подгруаем архивчики
    const fs : ZipFS = await fetch("/projects/реальные проекты010817.zip").then((r) => r.blob()).then(RealZipFS.create);

    const files = await fs.searchClsFiles([fs.path("C:")], true).then((c) => fs.arraybuffers(c));

    let _ = Enviroment;

    const lib = new SimpleLibrary(files.map((c) => readClsFile(new BinaryReader(c!))));

    const cll = [...lib];

    // "AnswerControl" - фаза перед запятой
    // "gruzi" - round((value, value))
    const st = 0;
    cll /*.slice(st, st + 10000)*/.forEach((c, i) => {
        console.log(st + i);
        // "mousepen", "sliderH", "AnswerControl",  "MyUgol", "gruzi"
        !["BYTE", "FLOAT", "INTEGER", "STRING", "WORD", "AnswerControl", "gruzi"].includes(c.name) && c.model();
    });
    console.log(`${[...unreleasedFunctions.values()].sort().join("\n")}\n${unreleasedFunctions.size}`);
    // const c = cll.find((c) => c.name === "DialogBox")!;
    // console.log(c["body"]["sourceCode"]);
    // console.log(c["body"].vars);
    // console.log(c.model);
    console.log(`Проверено ${cll.length} имджей (${files.length} файлов)`);
    return;
}
