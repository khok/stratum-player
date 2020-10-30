/*
 * Функции для нормализации файловых путей.
 */

/**
 * Преобразует юниксовый путь в DOS-овский.
 *
 * "projects/4/project.spj" преобразуется в "projects\4\project.spj"
 * @deprecated
 */
export function unixToDosPath(path: string) {
    return path
        .split("/")
        .filter((s) => s.length > 0)
        .join("\\");
}

export function unixPath(path: string) {
    return path
        .split(/[/\\]/)
        .filter((s) => s)
        .map((s) => s.trim())
        .join("/");
}

export function dosPath(path: string) {
    return path
        .split(/[/\\]/)
        .filter((s) => s)
        .map((s) => s.trim())
        .join("\\");
}

export function extractDir(path: string) {
    return path.substring(0, path.lastIndexOf("/"));
}

export function extractDirDos(path: string) {
    return path.substring(0, path.lastIndexOf("\\"));
}

// export function extractFilenameDos(path: string) {
//     return path.substring(path.lastIndexOf("\\") + 1, path.length);
// }

export function resolvePath(path: string, baseDir: string) {
    const parts = baseDir.split(/[/\\]/);
    return resolvePath2(path, parts);
}

export function resolvePath2(path: string, baseDirParts: string[]) {
    const parts = path.split(/[/\\]/);

    const result = baseDirParts.slice();
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (part.length === 0 || (part.length === 1 && part[0] === ".")) continue;
        if (part === "..") {
            if (result.length === 0) return undefined;
            result.pop();
        } else {
            result.push(part);
        }
    }

    return result.join("/");
}

/**
 * Нормализует путь `path` и разруливает его, если он относительный.
 * @param baseDir базовая директория
 */
// export function resolvePathDos(path: string, baseDir: string) {
//     const bDirParts = baseDir.split("\\");
//     return resolvePath2Dos(path, bDirParts);
// }

/**
 * Нормализует путь `path` и разруливает его, если он относительный.
 * @param baseDirParts компоненты нормализованного базового пути
 */
export function resolvePath2Dos(path: string, baseDirParts: string[]) {
    const parts = path.split(/[/\\]/);

    const result = baseDirParts.slice();
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (part.length === 0 || (part.length === 1 && part[0] === ".")) continue;
        if (part === "..") {
            if (result.length === 0) return undefined;
            result.pop();
        } else {
            result.push(part);
        }
    }

    return result.join("\\");
    // const parts = path.split(/[/\\]/);

    // // const isAbsolute = parts[0].trim()[1] === ":";
    // // if (isAbsolute)
    // //     return parts
    // //         .map((p) => p.trim())
    // //         .filter((p) => p.length > 0)
    // //         .join("\\");

    // const result = baseDirParts.slice();
    // for (let i = 0; i < parts.length; i++) {
    //     const part = parts[i].trim();
    //     if (part.length === 0 || (part.length === 1 && part[0] === ".")) continue;
    //     if (part === "..") {
    //         if (result.length === 0) return undefined;
    //         result.pop();
    //     } else {
    //         result.push(part);
    //     }
    // }
    // return result.join("\\");
}

// {
//     const expected = [
//         "C:/Stratum/Projects/test10-11_5_1_10/any folder",
//         "C:/Stratum/Projects/test10-11_5_1_10/4/more/libs",
//         "C:/Stratum/Projects/main library/lib",
//     ];
//     const paths = ".. /any folder/,/more/libs/,..  \\  ..  \\ main library \\ lib";
//     const baseDir = "C:/Stratum/Projects/test10-11_5_1_10/4";
//     console.log("Парсим: " + paths);
//     console.log("Относительно: " + baseDir);
//     console.log("результат:");
//     const results = parseClassSearchPaths(paths, baseDir);
//     for (let i = 0; i < expected.length; i++) {
//         console.log(`${i + 1}): ${expected[i] === results[i] ? "совпадает" : "НЕ СОВПАДАЕТ!!"}`);
//     }
//     console.log(results.join("\n"));
// }
export function parseClassSearchPaths(paths: string, baseDir: string): string[] {
    const bDirParts = baseDir.split(/[/\\]/);

    const separated = paths.split(",");
    const all = separated.map((p) => resolvePath2(p.trim(), bDirParts));
    const resolved = all.filter((v): v is string => v !== undefined);
    return resolved;
}

// export function resolvePath(path: string, baseDir: string): string | undefined {
//     if (!path.startsWith("..")) return path === "" ? "" : path[path.length - 1] === "\\" ? path : path + "\\";
//     const pathFragments = path.trim().split("\\");

//     const baseDirParts = baseDir.split("\\");
//     while (pathFragments[pathFragments.length - 1] === "") pathFragments.pop(); //убираем trailing slashes
//     while (baseDirParts[baseDirParts.length - 1] === "") baseDirParts.pop();

//     for (let i = 0; i < pathFragments.length; i++) {
//         const frag = pathFragments[i];
//         if (frag === "..") {
//             if (!baseDirParts.length) return undefined;
//             baseDirParts.pop();
//         } else {
//             baseDirParts.push(frag);
//         }
//     }
//     return baseDirParts.join("\\");
// }
