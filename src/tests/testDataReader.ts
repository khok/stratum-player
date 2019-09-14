import { zipFromUrl, readProjectFile, readClassFiles, readVarsFile, readAllClassFiles } from "../fileReader/zipReader";

(async function() {
    const zipFiles = await zipFromUrl([
        // "projects/moving_test.zip",
        "projects/BALLS.zip"
        // "/data/library.zip"
    ]);
    //Подгружаем
    const mainClassName = await readProjectFile(zipFiles);
    console.log(mainClassName);
    // const classes = await readClassFiles(zipFiles, mainClassName);
    // console.dir(classes);
    const allClasses = await readAllClassFiles(zipFiles);
    // console.dir(allClasses.get("Text"));
    // console.dir(allClasses.get("New_Project_Class"));
    console.dir(allClasses);
    const vars = await readVarsFile(zipFiles, allClasses);
    // console.dir(vars);
})();
