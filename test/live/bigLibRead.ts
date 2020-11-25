import { unzip } from "stratum/api";
import { VFSFile } from "stratum/vfs";
import { findMissingCommands, formatMissingCommands } from "stratum/vm/showMissingCommands";

async function load(name: string) {
    const r = await fetch(name);
    const uz = await r.blob();
    return unzip(uz);
}

// Тест чтения большой библиотеки имиджей
(async function () {
    const r = await Promise.all(["/projects/balls.zip", "/data/library.zip", "/projects/biglib.zip"].map(load));
    //prettier-ignore
    const files = [...r.reduce((a, b) => a.merge(b)).files(/.+\.cls$/i)];
    const mp = files.map((f) => (f as VFSFile).readAs("cls"));
    const cls = await Promise.all(mp);
    const { errors, missingOperations } = findMissingCommands(new Map(cls.map((c) => [c.name, c])));
    if (errors.length > 0) {
        console.warn("Возникли следующие ошибки:");
        console.dir(errors);
        console.dir(formatMissingCommands(missingOperations));
    } else {
        console.log("Ошибок не найдено.");
    }
})();
