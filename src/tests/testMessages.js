import { zipFromUrl, readClassFiles, readProjectFile, readVarsFile } from "../dataLoader";
import { Project } from "../project";
import "regenerator-runtime"

function assert(condition){
    if(!condition) throw new Error('Assertion error');
}

(async function() {
    const zipFiles = await zipFromUrl("/projects/test_messages.zip");
    const mainClassName = await readProjectFile(zipFiles);
    const collection = await readClassFiles(zipFiles, mainClassName);
    const vars = await readVarsFile(zipFiles, collection);
    const prj = new Project(mainClassName, collection, vars);
    const values = prj.tree.childs[0].varValues;
    assert(values[1].def == 21 && values[1].new == 21);
    prj.compute();
    assert(values[0].old == 60 && values[0].new == 60);
    assert(values[1].old == 25 && values[1].new == 25);
    prj.compute();
    assert(values[0].old == 120 && values[0].new == 120);
    assert(values[1].old == 29 && values[1].new == 29);
    console.log('Message test completed');
})();
