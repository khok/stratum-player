import { ClassPrototype } from "stratum/common/classPrototype";
import { BytecodeParser } from "stratum/common/fileFormats/cls";
import { ProjectInfo, readPrjFile } from "stratum/common/fileFormats/prj";
import { readSttFile } from "stratum/common/fileFormats/stt";
import { VirtualFileSystem } from "stratum/common/virtualFileSystem";
import { resolvePath2, unixToDosPath } from "stratum/helpers/pathOperations";

export const DefaultSttFileName = "_preload.stt";

export interface ReadClassesOpts<TVmCode> {
    /** Дополнительные директории поиска имиджей (чаще всего не нужны).*/
    addSearchDirs?: string[];
    bytecodeParser?: BytecodeParser<TVmCode>;
}

function findProjectFile(fs: VirtualFileSystem, filename: string) {
    const possiblePrjFiles = fs.findFiles(filename);

    if (possiblePrjFiles.length === 0) {
        throw new Error(`Файл проекта ${filename} не найден.`);
    }

    if (possiblePrjFiles.length > 1) {
        const names = possiblePrjFiles.map((f) => f.name).join(";\n");
        throw new Error(`Для искомого файла\n${filename}\nнайдено несколько совпадений:\n${names}.`);
    }

    return possiblePrjFiles[0];
}

function parsePrjSearchDirs(path: string, baseDir: string): string[] {
    const bDirParts = baseDir.split("\\");
    return path
        .split(",")
        .map((p) => resolvePath2(p.trim(), bDirParts))
        .filter((v): v is string => v !== undefined);
}

// function createSearchDirs(baseDirectory: string, libraryPaths?: string) {
//     const prjSearchDirs = libraryPaths ? parseSearchDirs(libraryPaths, baseDirectory) : [];
//     return [baseDirectory].concat(prjSearchDirs);
// }

export async function readProjectInfo(fs: VirtualFileSystem, prjFileName?: string) {
    const name = unixToDosPath(prjFileName || "project.spj");
    const file = findProjectFile(fs, name);
    const stream = await file.openStream();
    const params = readPrjFile(stream);
    return params;
}

export async function readPreloadStt(fs: VirtualFileSystem, prjBaseDir: string) {
    const file = fs.getFile(prjBaseDir + "\\" + DefaultSttFileName);
    if (!file) return undefined;
    const stream = await file.openStream();
    try {
        return readSttFile(stream);
    } catch (e) {
        console.error(`Ошибка чтения ${stream.filename}:\n${e}`);
        return undefined;
    }
}

export async function readClasses<TVmCode>(
    fs: VirtualFileSystem,
    prjData: ProjectInfo,
    { addSearchDirs, bytecodeParser }: ReadClassesOpts<TVmCode> = {}
) {
    // Нормализация путей поиска имиджей
    const prjLibPaths = prjData.settings && prjData.settings.libraryPaths;
    const prjSearchDirs = prjLibPaths ? parsePrjSearchDirs(prjLibPaths, prjData.baseDirectory) : [];

    const searchDirs = [prjData.baseDirectory] // директория файла .prj
        .concat(prjSearchDirs) // директории, прописанные в проекте
        .concat(addSearchDirs ? addSearchDirs.map((d) => unixToDosPath(d)) : []); //дополнительные директории

    const classFiles = fs.findFiles(".cls", searchDirs);
    const protos = await Promise.all(classFiles.map((f) => f.openStream().then((s) => new ClassPrototype(s, bytecodeParser))));

    const classes = new Map<string, ClassPrototype<TVmCode>>();
    protos.forEach((c) => {
        const key = c.name.toLowerCase();

        const size = classes.size;
        classes.set(key, c);

        //Защита от дублирования имиджей
        if (classes.size === size) {
            const files = protos.filter((c) => c.name.toLowerCase() === key).map((c) => c.filename);
            throw new Error(`Конфликт имен имиджей: "${c.name}" найден в ${files.length} файлах:\n${files.join(";\n")}.`);
        }
    });

    return classes;
}
