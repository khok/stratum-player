import { ok } from "assert";
import "regenerator-runtime";
import { readClassFiles, readProjectFile, readVarsFile, zipFromUrl } from "../../fileReader/zipReader";
import { Project } from "../../project";

(async function() {
    const zipFiles = await zipFromUrl("/projects/test_messages.zip");
    const mainClassName = await readProjectFile(zipFiles);
    const collection = await readClassFiles(zipFiles, mainClassName);
    const vars = await readVarsFile(zipFiles);
    const prj = new Project(mainClassName, collection, vars);
    const values = prj.tree.childs.get(2).variables;
    ok(values[1].defaultValue == 21 && values[1].newValue == 21);
    prj.compute();
    ok(values[0].oldValue == 60 && values[0].newValue == 60);
    ok(values[1].oldValue == 25 && values[1].newValue == 25);
    prj.compute();
    ok(values[0].oldValue == 120 && values[0].newValue == 120);
    ok(values[1].oldValue == 29 && values[1].newValue == 29);
    console.log('Message test successful');
})();
