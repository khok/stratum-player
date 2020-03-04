import { equal } from "assert";
import { loadProjectData, openZipFromUrl } from "~/fileReader/fileReaderHelpers";
import { createTools } from "~/graphics/graphicSpace/createToolsAndObjects";
import { TextTool } from "~/graphics/graphicSpace/tools";
import { HandleMap } from "~/helpers/handleMap";

(async function() {
    const files = await openZipFromUrl("test_projects/texts_test.zip");
    const { collection, rootName } = await loadProjectData(files);
    const scheme = collection.get(rootName)!.scheme!;
    console.dir(scheme);
    const tools = createTools(scheme, {} as any);
    ((tools as any).texts as HandleMap<TextTool>).forEach((t, idx) => {
        if (idx === 1) equal(t.assembledText.text, "Привет, мир!!");
        if (idx === 2) equal(t.assembledText.text, "Привет,\r\nкак,\r\nдела?");
    });
    console.log("Text assembly test comlpeted");
    // const cv = document.getElementById("canvas") as HTMLCanvasElement;
    // const ws = new WindowSystem({ globalCanvas: cv });
    // const proj = Project.create(rootName, collection, ws);
    // const resolver = proj.createSchemeInstance(rootName)!;
    // ws.createSchemeWindow("Test", "", resolver);
    // ws.renderAll();
})();
