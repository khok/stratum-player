import { zipFromUrl, readProjectFile, readClassFiles, readVarsFile, readAllClassFiles } from "../fileReader/zipReader";
import { showMissingCommands } from "../utils/showMissingCommands";

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
    const { messages, missingOperations } = showMissingCommands(allClasses);
    if (messages.length > 0) {
        console.warn("Возникли следующие ошибки:");
        console.dir(messages);
        console.dir(missingOperations);
    }
    console.dir(allClasses);
})();
