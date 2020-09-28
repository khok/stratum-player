import { BadDataError } from "/common/errors";
import { VirtualFile } from "./virtualFile";
import { loadFromFile, loadFromUrl } from "./zipHelpers";

// export type VirtualDirectoryType = "project" | "libs" | "stratum" | "addlibs"| "plugins";

export interface VirtualDirectorySource {
    /** Источник архива (URL/файл) */
    source: string | File;
    /** Виртуальная директория, в которую "монтируется" содержимое архива */
    prefix?: string;
    /** Кодировка архива (по умолчанию - cp866). */
    encoding?: string;
}

/**
 * Нечувствительная к регистру файловая система.
 * Единственный ее экземпляр используется для всех операций, связанных ФС: загрузки имиджей, изображений проекта.
 * в будущем - сохранения файлов.
 */
export class VirtualFileSystem {
    private files = new Array<VirtualFile>();

    /**
     * Создает новую файловую систему (FS) из указанных источников.
     * @param source источники (ссылки/файлы архивов), из которых должна быть построена FS.
     */
    static async new(source: VirtualDirectorySource | VirtualDirectorySource[]): Promise<VirtualFileSystem> {
        if (Array.isArray(source)) {
            const fsList = await Promise.all(source.map((s) => this.new(s)));
            return VirtualFileSystem.merge(fsList);
        }

        /**
         * Примеры валидных префиксов: 'C:', 'D:/Stratum', 'E:/FirstDir/second/'.
         * Примеры невалидных: 'Hello', '/root/', 'CD:'.
         */
        if (source.prefix && source.prefix[1] !== ":") throw new BadDataError(`Невалидный префикс: ${source.prefix}.`);

        const zip = await (typeof source.source === "string"
            ? loadFromUrl(source.source, source.encoding)
            : loadFromFile(source.source, source.encoding));

        const files = zip
            .filter((_, file) => !file.dir)
            .map((file) => {
                const fullName = source.prefix ? source.prefix + "/" + file.name : file.name;
                return VirtualFile.fromZipObject(file, fullName);
            });

        return new VirtualFileSystem(files);
    }

    static merge(fsList: VirtualFileSystem[]): VirtualFileSystem {
        const files = new Array<VirtualFile>().concat(...fsList.map((f) => f.files));
        return new VirtualFileSystem(files);
    }

    constructor(files: VirtualFile[]) {
        this.files = files;
    }

    /**
     * Возвращает список файлов, чьи имена оканчиваются на `endsWith`.
     *
     * @param directory Одна или несколько директорий, в которых производится поиск.
     */
    findFiles(endsWith: string, directory?: string | string[]): VirtualFile[] {
        const lcEnds = endsWith.toLowerCase();

        //каталог поиска не указан
        if (!directory) return this.files.filter(({ lowerCaseName: n }) => n.endsWith(lcEnds));

        //указан один каталог поиска
        if (!Array.isArray(directory)) {
            const lcDir = directory.toLowerCase() + "\\";
            return this.files.filter(({ lowerCaseName: n }) => n.endsWith(lcEnds) && n.startsWith(lcDir));
        }

        //указано несколько каталогов поиска
        const dirs = directory.map((d) => d.toLowerCase() + "\\");
        return this.files.filter(({ lowerCaseName: n }) => n.endsWith(lcEnds) && dirs.some((d) => n.startsWith(d)));
    }

    /**
     * Возвращает список файлов в директории `directory`.
     */
    getDirectory(directory: string): VirtualFile[] {
        const lcDir = directory.toLowerCase() + "\\";
        return this.files.filter(({ lowerCaseName }) => lowerCaseName.startsWith(lcDir));
    }

    /**
     * Возвращает файл с именем `name`.
     */
    getFile(filename: string): VirtualFile | undefined {
        const lcPath = filename.toLowerCase();
        return this.files.find((f) => f.lowerCaseName === lcPath);
    }
}
