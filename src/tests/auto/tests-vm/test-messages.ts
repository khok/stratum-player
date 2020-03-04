import { ok } from "assert";
import { createClassScheme } from "~/core/createClassScheme";
import { Project } from "~/core/project";
import { loadProjectData, openZipFromUrl } from "~/fileReader/fileReaderHelpers";

(async function() {
    const zipFiles = await openZipFromUrl("/test_projects/test_messages.zip");
    const { collection, rootName, varSet } = await loadProjectData(zipFiles);
    const { root, mmanager } = createClassScheme(rootName, collection);
    root.applyVarSetRecursive(varSet!);
    mmanager.initValues();
    const prj = new Project({ scheme: root, mmanager, classes: collection, windowSystem: {} as any });
    ok(mmanager.getDefaultVarValue(1) === 21 && mmanager.getNewVarValue(1) === 21);
    prj.oneStep();
    ok(mmanager.getOldVarValue(0) === 60 && mmanager.getNewVarValue(0) === 60);
    ok(mmanager.getOldVarValue(1) === 25 && mmanager.getNewVarValue(1) === 25);
    prj.oneStep();
    ok(mmanager.getOldVarValue(0) === 120 && mmanager.getNewVarValue(0) === 120);
    ok(mmanager.getOldVarValue(1) === 29 && mmanager.getNewVarValue(1) === 29);
    console.log("Message test completed");
})();
