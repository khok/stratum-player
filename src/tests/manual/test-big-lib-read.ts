import { readAllClassFiles } from "~/fileReader/zipReader";
import { openZipFromUrl } from "~/fileReader/fileReaderHelpers";
import { showMissingCommands, formatMissingCommands } from "~/helpers/showMissingCommands";
import { VmOperations } from "~/vm/operations";

//тестирует считывание cls/cls->vdr файлов;
(async function() {
    const zipFiles = await openZipFromUrl([
        "/test_projects/balls.zip",
        "/data/library.zip",
        "/test_projects/biglib.zip"
    ]);
    const allClasses = await readAllClassFiles(zipFiles);
    console.log("Анализируем ошибки вм...");
    const { errors, missingOperations } = showMissingCommands(allClasses, VmOperations);
    if (errors.length > 0) {
        console.warn("Возникли следующие ошибки:");
        console.dir(errors);
        console.dir(formatMissingCommands(missingOperations));
    } else {
        console.log("Ошибок не найдено.");
    }
})();
