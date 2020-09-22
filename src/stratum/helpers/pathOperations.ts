/*
 * Функции для нормализации файловых путей.
 */

/**
 * Преобразует юниксовый путь в DOS-овский.
 *
 * "projects/4/project.spj" преобразуется в "projects\4\project.spj"
 */
export function unixToDosPath(path: string) {
    return path
        .split("/")
        .filter((s) => s.length > 0)
        .join("\\");
}

/**
 * Нормализирует путь, убирая трелйнг слеши:
 *
 * "projects\\\4\\\project.spj" преобразуется в "projects\4\project.spj"
 */

// export function normalizeWindowsPath(path: string) {
//     return path
//         .split("\\")
//         .filter((v) => v.length > 0)
//         .join("\\");
// }

// export function toUnixPath(path: string) {
//     return path
//         .split("\\")
//         .filter((v) => v.length > 0)
//         .join("/");
// }

export function extractDirectory(path: string) {
    return path.substring(0, path.lastIndexOf("\\"));
}

export function extractFilename(path: string) {
    return path.substring(path.lastIndexOf("\\") + 1, path.length);
}

/**
 * Нормализует путь `path` и разруливает его, если он относительный.
 * @param baseDir базовая директория
 */
export function resolvePath(path: string, baseDir: string) {
    const bDirParts = baseDir.split("\\");
    return resolvePath2(path, bDirParts);
}

/**
 * Нормализует путь `path` и разруливает его, если он относительный.
 * @param baseDirParts компоненты нормализованного базового пути
 */
export function resolvePath2(path: string, baseDirParts: string[]) {
    const parts = path.split(/[//\\]/);

    const isAbsolute = parts[0].trim()[1] === ":";
    if (isAbsolute)
        return parts
            .map((p) => p.trim())
            .filter((p) => p.length > 0)
            .join("\\");

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
