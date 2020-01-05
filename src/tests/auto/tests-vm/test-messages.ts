import { ok } from "assert";
import { createClassScheme } from "~/core/createClassScheme";
import { Project } from "~/core/project";
import { openZipFromUrl } from "~/fileReader/fileReaderHelpers";
import { readClassFiles, readProjectFile, readVarsFile } from "~/fileReader/zipReader";

(async function() {
    const zipFiles = await openZipFromUrl("/test_projects/test_messages.zip");
    const mainClassName = await readProjectFile(zipFiles);
    const collection = await readClassFiles(zipFiles, mainClassName);
    const vars = await readVarsFile(zipFiles);
    const { root, mmanager } = createClassScheme(mainClassName, collection);
    root.applyVarSetRecursive(vars!);
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
