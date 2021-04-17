// import { unzip } from "stratum/api";
// import { createTools } from "stratum/graphics/scene/createToolsAndObjects";
// import { HandleMap } from "stratum/helpers/handleMap";
// import { Player } from "stratum/player";
// import { TextTool } from "stratum/vm/interfaces/graphicSpaceTools";
// const { strictEqual } = chai.assert;

// it("Правильно собирается текст", async () => {
//     const fs = await fetch("/projects/test_text_assembly.zip")
//         .then((r) => r.blob())
//         .then(unzip);
//     const prj = (await fs.project({ additionalClassPaths: ["library"] })) as Player;

//     const scheme = prj["classes"].get(prj["prjInfo"].rootClassName)!.scheme!;
//     console.dir(scheme);
//     const tools = createTools(scheme);
//     ((tools as any).texts as HandleMap<TextTool>).forEach((t, idx) => {
//         if (idx === 1) strictEqual(t.assembledText.text, "Привет, мир!!");
//         if (idx === 2) strictEqual(t.assembledText.text, "Привет,\r\nкак,\r\nдела?");
//     });
// });
