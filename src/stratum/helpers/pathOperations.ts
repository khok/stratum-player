import { assert } from "chai";

/**
 * Различные операции по нормализации файловых путей.
 */
export const SLASHES = /[/\\]/;

// console.log(getPathParts("c:\\ Pgra m \\  \\  \\ Files kek  ///// \\..\\ / lol.prj").join("\\"));
export function splitPath(path: string) {
    return path
        .split(SLASHES) //Делим по слешам
        .map((s) => s.trim()) // Убираем лишние пробелы
        .filter((s) => s.length > 0); // Фильтруем пустоты.
}

export function assertDiskPrefix(prefix: string) {
    if (prefix.length !== 1 || !/[A-Z]/.test(prefix)) throw Error(`Некорректный префикс диска: ${prefix}.`);
}

export function getPrefixAndPathParts(baseDir: string, defPrefixUC: string): [string, string[]] {
    const prefAndDir = baseDir.split(":");
    if (prefAndDir.length > 2) {
        throw Error("Двоеточие после префикса диска должно встречаться лишь единожды.");
    }
    let prefixUC = defPrefixUC;
    let rest = prefAndDir[0];
    if (prefAndDir.length !== 1) {
        rest = prefAndDir[1];
        const firstUC = prefAndDir[0].trim().toUpperCase();
        assertDiskPrefix(firstUC);
        prefixUC = firstUC;
    }
    return [prefixUC, splitPath(rest)];
}
