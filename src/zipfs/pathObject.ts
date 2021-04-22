import { FileSystem, PathInfo } from "stratum";

export class PathObject implements PathInfo {
    private static readonly defPrefix = "C";
    private static splitPath(path: string): ReadonlyArray<string> {
        return path
            .split(/[/\\]/) //Делим по слешам
            .map((s) => s.trim()) // Убираем лишние пробелы
            .filter((s) => s.length > 0); // Фильтруем пустоты.
    }
    private static resolve(path: string, base?: PathObject): [string, ReadonlyArray<string>] {
        const pathParts = PathObject.splitPath(path);
        if (pathParts.length === 0) return base ? [base.vol, base.parts] : [PathObject.defPrefix, []];

        const isAbsolute = pathParts[0].length === 2 && pathParts[0][1] === ":";
        const parts: string[] = isAbsolute ? [] : base?.parts.slice() ?? [];
        for (let i = isAbsolute ? 1 : 0; i < pathParts.length; ++i) {
            const next = pathParts[i];
            if (next === "..") {
                parts.pop();
            } else if (next !== ".") {
                parts.push(next);
            }
        }
        return [isAbsolute ? pathParts[0][0] : base?.vol ?? PathObject.defPrefix, parts];
    }

    constructor(readonly fs: FileSystem, readonly vol: string = PathObject.defPrefix, readonly parts: ReadonlyArray<string> = []) {}

    child(name: string): PathObject {
        return new PathObject(this.fs, this.vol, this.parts.concat(name));
    }

    resolve(path: string): PathObject {
        const [vol, parts] = PathObject.resolve(path, this);
        return new PathObject(this.fs, vol, parts);
    }

    private cached: string | null = null;
    toString(): string {
        if (this.cached !== null) return this.cached;
        const p = this.parts.join("\\");
        if (p.length === 0) return this.vol + ":";
        return (this.cached = this.vol + ":\\" + p);
    }
}

// export function resolve(base: PathInfo, path: string): PathInfo {}

// export function combine(path: PathInfo): string {
//     const p = path.parts.join("\\");
//     if (p.length === 0) return path.vol + ":";
//     return path.vol + ":\\" + p;
// }

// export class PathLike {
//     private static partIsDisk(part: string) {
//         return part.length === 2 && part[1] === ":";
//     }
//     private static splitPath(path: string): ReadonlyArray<string> {
//         return path
//             .split(SLASHES) //Делим по слешам
//             .map((s) => s.trim()) // Убираем лишние пробелы
//             .filter((s) => s.length > 0); // Фильтруем пустоты.
//     }
//     static from(realPath: string) {
//         const data = PathLike.splitPath(realPath);
//         if (data.length < 1 || !PathLike.partIsDisk(data[0])) throw Error(`Некорретный путь файла: ${realPath}`);
//         return new PathLike(data);
//     }
//     constructor(private data: ReadonlyArray<string>, readonly length: number = data.length) {}
//     parent(): PathLike {
//         return this.length > 1 ? new PathLike(this.data, this.length - 1) : this;
//     }
//     atUC(i: number): string {
//         return this.data[i].toUpperCase();
//     }
//     at(i: number): string {
//         return this.data[i];
//     }
//     resolve(localPath: string): PathLike {
//         const pathParts = PathLike.splitPath(localPath);
//         if (pathParts.length === 0) return this;

//         const isAbsolute = pathParts[0].length === 2 && pathParts[0][1] === ":";
//         const result: string[] = isAbsolute ? [] : this.data.slice(1, this.length);
//         for (let i = isAbsolute ? 1 : 0; i < pathParts.length; ++i) {
//             const next = pathParts[i];
//             if (next === "..") {
//                 result.pop();
//             } else if (next !== ".") {
//                 result.push(next);
//             }
//         }
//         result.unshift(isAbsolute ? pathParts[0] : this.data[0]);
//         return new PathLike(result);
//     }
//     private _path: string | null = null;
//     makePath(): string {
//         return this._path ?? (this._path = this.data.slice(0, this.length).join("\\"));
//     }
// }

// console.log(getPathParts("c:\\ Pgra m \\  \\  \\ Files kek  ///// \\..\\ / lol.prj").join("\\"));

// export function resolvePath(baseParts: PathLike, path: string): PathLike {
//     const pathParts = splitPath(path);
//     if (pathParts.length === 0) return baseParts;

//     const isAbsolute = pathParts[0].length === 2 && pathParts[0][1] === ":";
//     const result: string[] = isAbsolute ? [] : baseParts.toArray();
//     for (let i = isAbsolute ? 1 : 0; i < pathParts.length; ++i) {
//         const next = pathParts[i];
//         if (next === "..") {
//             result.pop();
//         } else if (next !== ".") {
//             result.push(next);
//         }
//     }
//     return new PathLike(isAbsolute ? pathParts[0] : baseParts.disk, result);
// }

// export function assertDiskPrefix(prefix: string): void {
//     if (prefix.length !== 1 || !/[A-Z]/.test(prefix)) throw Error(`Некорректный префикс диска: ${prefix}.`);
// }

// export function getPrefixAndPathParts(baseDir: string, defPrefixUC: string): [string, ReadonlyArray<string>] {
//     const prefAndDir = baseDir.split(":");
//     if (prefAndDir.length > 2) {
//         throw Error("Двоеточие после префикса диска должно встречаться лишь единожды.");
//     }
//     let prefixUC = defPrefixUC;
//     let rest = prefAndDir[0];
//     if (prefAndDir.length !== 1) {
//         rest = prefAndDir[1];
//         const firstUC = prefAndDir[0].trim().toUpperCase();
//         assertDiskPrefix(firstUC);
//         prefixUC = firstUC;
//     }
//     return [prefixUC, splitPath(rest)];
// }
