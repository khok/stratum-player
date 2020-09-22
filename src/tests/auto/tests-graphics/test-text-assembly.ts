import { strictEqual } from "assert";
import { VirtualFileSystem } from "~/common/virtualFileSystem";
import { createTools } from "~/graphics/scene/createToolsAndObjects";
import { HandleMap } from "~/helpers/handleMap";
import { Project } from "~/project/project";
import { TextTool } from "~/vm/interfaces/graphicSpaceTools";

(async function () {
    const fs = await VirtualFileSystem.new({ source: "/test_projects/texts_test.zip" });
    const prj = await Project.open(fs, { addSearchDirs: ["library/"] });
    const classes = prj.classes;

    const scheme = classes.get(prj.rootClassName.toLowerCase())!.scheme!;
    console.dir(scheme);
    const tools = createTools(scheme);
    ((tools as any).texts as HandleMap<TextTool>).forEach((t, idx) => {
        if (idx === 1) strictEqual(t.assembledText.text, "Привет, мир!!");
        if (idx === 2) strictEqual(t.assembledText.text, "Привет,\r\nкак,\r\nдела?");
    });
    console.log("Text assembly test comlpeted.");
})();
