import { loadAsync } from "jszip";
import { FileSystem, ProjectOptions, ZipFsOptions } from "stratum/api";
import { ClassProto } from "stratum/common/classProto";
import { ProjectInfo, readPrjFile } from "stratum/fileFormats/prj";
import { readSttFile, VariableSet } from "stratum/fileFormats/stt";
import { BinaryStream } from "stratum/helpers/binaryStream";
import { extractDir, parseClassSearchPaths, unixPath } from "stratum/helpers/pathOperations";
import { Player } from "stratum/player";
import { parseBytecode } from "stratum/vm/parseBytecode";
import { ParsedCode } from "stratum/vm/types";
import { DataSource, VirtualFile } from "./virtualFile";

export class ZipFileSystem implements FileSystem {
    static async new(source: Blob | ArrayBuffer, options: ZipFsOptions = {}): Promise<ZipFileSystem> {
        const decoder = new TextDecoder(options.encoding || "cp866");

        const arch = await loadAsync(source, {
            decodeFileName: (b) => decoder.decode(b),
            createFolders: false,
        });

        const files = new Map<string, VirtualFile>();
        arch.forEach((_, f) => {
            if (f.dir) return;
            const file = new VirtualFile(f.name, new DataSource(f));
            files.set(file.path.toUpperCase(), file);
        });

        return new ZipFileSystem(files);
    }

    private constructor(private fileMap: Map<string, VirtualFile>) {}

    mount(fs: this, path?: string): this {
        let dir = path ? unixPath(path) : "";
        if (dir) dir += "/";
        fs.fileMap.forEach((f) => {
            const prevSize = this.fileMap.size;
            const mountPath = dir + f.path;
            this.fileMap.set(mountPath.toUpperCase(), f.as(mountPath));
            if (this.fileMap.size === prevSize) {
                throw Error(`Конфликт имен файлов: ${mountPath}`);
            }
        });
        return this;
    }

    search(regexp: RegExp): VirtualFile[] {
        const res = new Array<VirtualFile>();
        for (const v of this.fileMap.values()) if (regexp.test(v.path)) res.push(v);
        return res;
    }

    files(directory?: string): VirtualFile[] {
        if (!directory) return [...this.fileMap.values()];
        const ucDir = directory.toUpperCase();
        const res = new Array<VirtualFile>();
        for (const [k, v] of this.fileMap.entries()) if (k.startsWith(ucDir)) res.push(v);
        return res;
    }

    file(filename: string): VirtualFile | undefined {
        return this.fileMap.get(filename.toUpperCase());
    }

    async project(options: ProjectOptions = {}) {
        let prj: ProjectInfo, projectDir: string;
        {
            let prjFile: VirtualFile | undefined;
            const matches = new Array<string>();

            const searchKey = options.path && unixPath(options.path).toUpperCase();
            for (const [k, v] of this.fileMap.entries()) {
                const match = searchKey ? k.endsWith(searchKey) : k.endsWith(".PRJ") || k.endsWith(".SPJ");
                if (!match) continue;

                prjFile = v;
                matches.push(v.path);
                if (options.firstMatch) break;
            }
            if (!prjFile) throw Error(`Не найдено файлов проектов.`);
            if (matches.length > 1) throw Error(`Найдено несколько файлов проектов:\n${matches.join("\n")}`);

            const prjBuf = await prjFile.arraybuffer();
            const stream = new BinaryStream(prjBuf, {
                filepath: prjFile.path,
                filepathDos: prjFile.pathDos,
            });
            prj = readPrjFile(stream);
            projectDir = extractDir(prjFile.path);
        }

        const classes = new Map<string, ClassProto<ParsedCode>>();
        {
            let classDirs = [projectDir];
            if (prj.settings && prj.settings.classSearchPaths) {
                const parsed = parseClassSearchPaths(prj.settings.classSearchPaths, projectDir);
                classDirs = classDirs.concat(parsed);
            }
            if (options.additionalClassPaths) {
                const add = options.additionalClassPaths.map((p) => unixPath(p));
                classDirs = classDirs.concat(add);
            }

            // make better (исп. регехи вместо досовсих поисковиков и т.д.)
            const classFiles = this.findFiles(".cls", classDirs);

            //prettier-ignore
            const mp = classFiles.map((f) => f.arraybuffer().then((a) => new ClassProto(a, {
                bytecodeParser: parseBytecode,
                filepathDos: f.pathDos,
            })));

            const protos = await Promise.all(mp);

            protos.forEach((c) => {
                const key = c.name.toLowerCase();
                const prevSize = classes.size;

                classes.set(key, c);

                if (classes.size === prevSize) {
                    const files = protos.filter((c) => c.name.toLowerCase() === key).map((c) => c.filepathDos);
                    throw new Error(`Конфликт имен имиджей: "${c.name}" найден в ${files.length} файлах:\n${files.join(";\n")}.`);
                }
            });
        }

        let stt: VariableSet | undefined;
        {
            const sttPath = projectDir + "/_preload.stt";
            const sttFile = this.file(sttPath);
            if (sttFile) {
                const sttBuf = await sttFile.arraybuffer();
                const stream = new BinaryStream(sttBuf, { filepath: sttFile.path, filepathDos: sttFile.pathDos });
                try {
                    stt = readSttFile(stream);
                } catch (e) {
                    console.warn(`Ошибка чтения ${sttPath}`, e.message);
                }
            } else {
                console.warn(`Файл ${sttPath} не существует.`);
            }
        }

        return new Player({ fs: this, classes, prj, stt });
    }

    findFiles(endsWith: string, directory?: string | string[]): VirtualFile[] {
        const ucEnds = endsWith.toUpperCase();
        const res = new Array<VirtualFile>();

        //каталог поиска не указан
        if (!directory) {
            for (const [k, v] of this.fileMap.entries()) if (k.endsWith(ucEnds)) res.push(v);
            return res;
        }

        //указан один каталог поиска
        if (!Array.isArray(directory)) {
            const ucDir = directory.toUpperCase() + "/";
            for (const [k, v] of this.fileMap.entries()) if (k.endsWith(ucEnds) && k.startsWith(ucDir)) res.push(v);
            return res;
        }

        //указано несколько каталогов поиска
        const dirs = directory.map((d) => d.toUpperCase() + "/");
        for (const [k, v] of this.fileMap.entries()) if (k.endsWith(ucEnds) && dirs.some((d) => k.startsWith(d))) res.push(v);
        return res;
    }

    /**
     * Возвращает файл с именем `name`.
     */
    getFileDos(path: string): VirtualFile | undefined {
        const ucPath = path.toUpperCase();
        for (const f of this.fileMap.values()) if (f.pathDosUC === ucPath) return f;
        return undefined;
    }

    // //dos functions
    // findFilesDos(endsWith: string, directory?: string | string[]): VirtualFile[] {
    //     const ucEnds = endsWith.toUpperCase();
    //     const res = new Array<VirtualFile>();

    //     //каталог поиска не указан
    //     if (!directory) {
    //         for (const f of this.fileMap.values()) if (f.pathDos.endsWith(ucEnds)) res.push(f);
    //         return res;
    //     }

    //     //указан один каталог поиска
    //     if (!Array.isArray(directory)) {
    //         const ucDir = directory.toUpperCase() + "\\";
    //         for (const f of this.fileMap.values()) if (f.pathDos.endsWith(ucEnds) && f.pathDos.startsWith(ucDir)) res.push(f);
    //         return res;
    //     }

    //     //указано несколько каталогов поиска
    //     const dirs = directory.map((d) => d.toUpperCase() + "\\");
    //     for (const f of this.fileMap.values()) if (f.pathDos.endsWith(ucEnds) && dirs.some((d) => f.pathDos.startsWith(d))) res.push(f);
    //     return res;
    // }
}
