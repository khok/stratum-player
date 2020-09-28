// import { readAllClassFiles } from "stratum/fileReader/zipReader";
// import { openZipFromUrl } from "stratum/fileReader/fileReaderHelpers";
// import { showMissingCommands, formatMissingCommands } from "stratum/helpers/showMissingCommands";
// import { operations } from "stratum/vm/operations";

// //тестирует считывание cls/cls->vdr файлов;
// (async function () {
//     const files = await openZipFromUrl(["/test_projects/balls.zip", "/data/library.zip", "/test_projects/biglib.zip"]);
//     const allClasses = await readAllClassFiles({ files, baseDir: "", baseDirDepth: 0, rootClassName: "" });
//     console.log("Анализируем ошибки вм...");
//     const { errors, missingOperations } = showMissingCommands(allClasses, operations);
//     if (errors.length > 0) {
//         console.warn("Возникли следующие ошибки:");
//         console.dir(errors);
//         console.dir(formatMissingCommands(missingOperations));
//     } else {
//         console.log("Ошибок не найдено.");
//     }
// })();
