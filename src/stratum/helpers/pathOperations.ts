/**
 * Различные операции по нормализации файловых путей.
 */
export const SLASHES = /[/\\]/;

// console.log(getPathParts("c:\\ Pgra m \\  \\  \\ Files kek  ///// \\..\\ / lol.prj").join("\\"));
export function getPathParts(path: string) {
    return path
        .split(SLASHES) //Делим по слешам
        .map((s) => s.trim()) // Убираем лишние пробелы
        .filter((s) => s); // Фильтруем пустоты.
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
        if (firstUC.length !== 1 || !/[A-Z]/.test(firstUC)) throw Error("Префикс диска должен состоять из одной латинской буквы");
        prefixUC = firstUC;
    }
    return [prefixUC, getPathParts(rest)];
}
