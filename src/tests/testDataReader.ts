import { zipFromUrl, readProjectFile, readClassFiles, readVarsFile, readAllClassFiles } from "../fileReader/zipReader";

(async function() {
    const zipFiles = await zipFromUrl([
        // "projects/moving_test.zip",
        "projects/BALLS.zip",
        "/data/library.zip"
    ]);
    //Подгружаем
    const mainClassName = await readProjectFile(zipFiles);
    console.log(mainClassName);
    const vars = await readVarsFile(zipFiles);
    const allClasses = await readAllClassFiles(zipFiles);
    console.dir(allClasses);
})();
