import { ok } from "assert";
import { createClassScheme } from "~/core/createClassScheme";
import { Project } from "~/core/project";
import { readProjectData, openZipFromUrl } from "~/fileReader/fileReaderHelpers";
import { ClassState } from "vm-interfaces-base";

(async function () {
    const zipFiles = await openZipFromUrl("/test_projects/test_messages.zip");
    const { collection, rootName, varSet } = await readProjectData(zipFiles);
    const { root, mmanager } = createClassScheme(rootName, collection);
    root.applyVarSetRecursive(varSet!);
    const ch1 = (root as any).childs.get(2) as ClassState;

    const prj = new Project({ scheme: root, mmanager, classes: collection, windowSystem: {} as any });

    mmanager.initValues();
    //prettier-ignore
    ok(mmanager.defaultDoubleValues[ch1.doubleVarMappingArray![0]] === 0 && mmanager.newDoubleValues[ch1.doubleVarMappingArray![0]] === 0);
    //prettier-ignore
    ok(mmanager.defaultDoubleValues[ch1.doubleVarMappingArray![1]] === 21 && mmanager.newDoubleValues[ch1.doubleVarMappingArray![1]] === 21);

    prj.oneStep();
    //prettier-ignore
    ok(mmanager.oldDoubleValues[ch1.doubleVarMappingArray![0]] === 60 && mmanager.newDoubleValues[ch1.doubleVarMappingArray![0]] === 60);
    //prettier-ignore
    ok(mmanager.oldDoubleValues[ch1.doubleVarMappingArray![1]] === 25 && mmanager.newDoubleValues[ch1.doubleVarMappingArray![1]] === 25);

    prj.oneStep();
    //prettier-ignore
    ok(mmanager.oldDoubleValues[ch1.doubleVarMappingArray![0]] === 120 && mmanager.newDoubleValues[ch1.doubleVarMappingArray![0]] === 120);
    //prettier-ignore
    ok(mmanager.oldDoubleValues[ch1.doubleVarMappingArray![1]] === 29 && mmanager.newDoubleValues[ch1.doubleVarMappingArray![1]] === 29);

    console.log("Message test completed");
})();
