import { ok } from "assert";
import { createClassTree } from "~/core/createClassScheme";
import { Project } from "~/core/project";
import { readProjectData, openZipFromUrl } from "~/fileReader/fileReaderHelpers";
import { ClassState } from "vm-interfaces-base";
import { VmContext } from "~/vm/vmContext";

(async function () {
    const zipFiles = await openZipFromUrl("/test_projects/test_messages.zip");
    const { classesData, rootName, varSet } = await readProjectData(zipFiles);
    const { classTree, mmanager } = createClassTree(rootName, classesData);
    classTree.applyVarSetRecursive(varSet!);
    const allClasses = classTree.collectNodes();
    const ch1 = (classTree as any).childs.get(2) as ClassState;

    const project = new Project({ allClasses, classesData });
    const ctx = new VmContext({ windows: {} as any, project, memoryState: mmanager });

    mmanager.initValues();
    //prettier-ignore
    ok(mmanager.defaultDoubleValues[ch1.doubleVarMappingArray![0]] === 0 && mmanager.newDoubleValues[ch1.doubleVarMappingArray![0]] === 0);
    //prettier-ignore
    ok(mmanager.defaultDoubleValues[ch1.doubleVarMappingArray![1]] === 21 && mmanager.newDoubleValues[ch1.doubleVarMappingArray![1]] === 21);

    classTree.computeSchemeRecursive(ctx);
    mmanager.syncValues();
    //prettier-ignore
    ok(mmanager.oldDoubleValues[ch1.doubleVarMappingArray![0]] === 60 && mmanager.newDoubleValues[ch1.doubleVarMappingArray![0]] === 60);
    //prettier-ignore
    ok(mmanager.oldDoubleValues[ch1.doubleVarMappingArray![1]] === 25 && mmanager.newDoubleValues[ch1.doubleVarMappingArray![1]] === 25);

    classTree.computeSchemeRecursive(ctx);
    mmanager.syncValues();
    //prettier-ignore
    ok(mmanager.oldDoubleValues[ch1.doubleVarMappingArray![0]] === 120 && mmanager.newDoubleValues[ch1.doubleVarMappingArray![0]] === 120);
    //prettier-ignore
    ok(mmanager.oldDoubleValues[ch1.doubleVarMappingArray![1]] === 29 && mmanager.newDoubleValues[ch1.doubleVarMappingArray![1]] === 29);

    console.log("Message test completed");
})();
