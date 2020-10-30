import { unzip } from "stratum/api";
import { ClassProto } from "stratum/common/classProto";
import { parseBytecode } from "stratum/vm/parseBytecode";
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
    const files = r.reduce((a, b) => a.mount(b)).search(/.+\.cls$/i);
    const mp = files.map((f) => f.arraybuffer().then((a) => new ClassProto(a, { bytecodeParser: parseBytecode, filepathDos: f.path })));
    const cls = await Promise.all(mp);
    console.log("Анализируем ошибки вм...");
    const { errors, missingOperations } = findMissingCommands(new Map(cls.map((c) => [c.name, c])));
    if (errors.length > 0) {
        console.warn("Возникли следующие ошибки:");
        console.dir(errors);
        console.dir(formatMissingCommands(missingOperations));
    } else {
        console.log("Ошибок не найдено.");
    }
})();
