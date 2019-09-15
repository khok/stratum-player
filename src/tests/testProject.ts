import { readClassFiles, readProjectFile, readVarsFile, zipFromUrl } from "../fileReader/zipReader";
import { Project } from "../project";

(async function() {
    const zipFiles = await zipFromUrl([
        // "projects/moving_test.zip",
        "projects/BALLS.zip",
        "/data/library.zip"
    ]);
    //Подгружаем
    const mainClassName = await readProjectFile(zipFiles);
    console.log(mainClassName);
    const classes = await readClassFiles(zipFiles, mainClassName);
    console.dir(classes);
    const vars = await readVarsFile(zipFiles, classes);
    const prj = new Project(mainClassName, classes, vars);
    console.dir(prj);
})();
