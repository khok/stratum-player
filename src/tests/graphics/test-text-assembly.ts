import { VirtualFileSystem } from "stratum/common/virtualFileSystem";
import { createTools } from "stratum/graphics/scene/createToolsAndObjects";
import { HandleMap } from "stratum/helpers/handleMap";
import { Project } from "stratum/project/project";
import { TextTool } from "stratum/vm/interfaces/graphicSpaceTools";
const { strictEqual } = chai.assert;

it("Правильно собирается текст", async () => {
    const fs = await VirtualFileSystem.new({ source: "/projects/texts_test.zip" });
    const prj = await Project.open(fs, { addSearchDirs: ["library/"] });
    const classes = prj.classes;

    const scheme = classes.get(prj.rootClassName.toLowerCase())!.scheme!;
    console.dir(scheme);
    const tools = createTools(scheme);
    ((tools as any).texts as HandleMap<TextTool>).forEach((t, idx) => {
        if (idx === 1) strictEqual(t.assembledText.text, "Привет, мир!!");
        if (idx === 2) strictEqual(t.assembledText.text, "Привет,\r\nкак,\r\nдела?");
    });
});
