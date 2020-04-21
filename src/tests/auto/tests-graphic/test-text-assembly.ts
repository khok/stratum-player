import { equal } from "assert";
import { readProjectData, openZipFromUrl } from "~/fileReader/fileReaderHelpers";
import { createTools } from "~/graphics/graphicSpace/createToolsAndObjects";
import { TextTool } from "~/graphics/graphicSpace/tools";
import { HandleMap } from "~/helpers/handleMap";

(async function () {
    const files = await openZipFromUrl("test_projects/texts_test.zip");
    const { classesData, rootName } = await readProjectData(files);
    const scheme = classesData.get(rootName)!.scheme!;
    console.dir(scheme);
    const tools = createTools(scheme, {} as any);
    ((tools as any).texts as HandleMap<TextTool>).forEach((t, idx) => {
        if (idx === 1) equal(t.assembledText.text, "Привет, мир!!");
        if (idx === 2) equal(t.assembledText.text, "Привет,\r\nкак,\r\nдела?");
    });
    console.log("Text assembly test comlpeted");
})();
