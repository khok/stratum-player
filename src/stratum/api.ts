import { FastestComputer, SmoothComputer } from "stratum/common/computers";
import { createZipFS } from "stratum/vfs";

export interface FileSystemConstructor {
    (): FileSystem;
}

export interface OpenZipOptions {
    /**
     * Каталог, в которую монтируется содержимое архива.
     * Может начинаться с префикса диска, например, `C:/Projects`
     * Если префикс не указан, то он автоматически устанавливается как `C:`
     * @default "C:"
     */
    directory?: string;
    /**
     * Кодировка файловых путей.
     * @default "cp866"
     */
    encoding?: string;
}

export type ZipSource = File | Blob | ArrayBuffer | Uint8Array;

export interface ZipFSConstructor {
    /**
     * Создает новую файловую систему из указанных источников ZIP-архивов.
     * @param source Источник ZIP-архива.
     * @param options Опции распаковки ZIP-архива.
     */
    (source: ZipSource, options?: OpenZipOptions): Promise<FileSystem>;
}

/**
 * Файловая система.
 */
export interface FileSystem {
    /**
     * Объединяет содержимое двух файловых систем.
     */
    merge(fs: FileSystem): this;
    /**
     * Возвращает список файлов в системе.
     * @param regexp - условия поиска файлов.
     */
    files(regexp?: RegExp): IterableIterator<FileSystemFile>;
    /**
     * Открывает проект.
     */
    project(options?: OpenProjectOptions): Promise<Project>;
}

// export type FileSystemFileData = ZipSource | string;
export type FileSystemFileData = ArrayBuffer;

/**
 * Представляет каталог в файловой системе.
 */
export interface FileSystemDir {
    readonly dir: true;
    /**
     * Родительский каталог.
     * Корневой каталог (корень диска) является родительским самому себе.
     */
    readonly parent: FileSystemDir;
    /**
     * Абсолютный путь в DOS-формате, включая префикс диска.
     */
    readonly pathDos: string;
    /**
     * Пытается создать файл.
     * @param path - нечувствительный к регистру относительный или абсолютный
     * путь к создаваемому файлу.
     * Если файл с указанным именем не удалось создать, возвращает undefined.
     */
    create(type: "file", path: string, data?: FileSystemFileData): FileSystemFile | undefined;
    /**
     * Пытается создать каталог.
     * @param path - нечувствительный к регистру относительный или абсолютный
     * путь к создаваемому каталогу.
     * Если каталог с указанным именем не удалось создать, возвращает undefined.
     */
    create(type: "dir", path: string): FileSystemDir | undefined;
    /**
     * Возвращает файл или каталог относительно текущего каталога.
     * @param path - нечувствительный к регистру относительный или абсолютный
     * путь к искомому файлу или каталогу.
     */
    get(path: string): FileSystemDir | FileSystemFile | undefined;
    /**
     * Возвращает список файлов в каталоге и его подкаталогах.
     * @param regexp - условия поиска файлов.
     */
    files(regexp?: RegExp): IterableIterator<FileSystemFile>;
}

/**
 * Представляет файл в файловой системе.
 */
export interface FileSystemFile {
    readonly dir: false;
    /**
     * Родительский каталог.
     * Корневой каталог (корень диска) является родительским самому себе.
     */
    readonly parent: FileSystemDir;
    /**
     * Абсолютный путь в DOS-формате, включая префикс диска.
     */
    readonly pathDos: string;
    /**
     * Явно предзагружает содержимое файла.
     * Только явно предзагруженные файлы могут быть прочитаны в процессе
     * исполнения проекта.
     * В противном случае будет создано исключение.
     */
    makeSync(): Promise<void>;
    /**
     * Возвращает содержимое файла.
     * Не делает файл явно предзагруженным.
     * Для этого явно используется @method makeSync.
     */
    arraybuffer(): Promise<ArrayBuffer>;
}

export interface ProjectOptions {
    /**
     * Запрещает проекту изменять размеры главного окна.
     */
    disableWindowResize?: boolean;
}

export interface OpenProjectOptions extends ProjectOptions {
    /**
     * Часть пути к файлу проекта.
     */
    path?: string;
    /**
     * Дополнительные пути поиска файлов имиджей.
     */
    additionalClassPaths?: string[];
}

/**
 * Проект.
 */
export interface Project {
    /**
     * Опции проекта.
     */
    readonly options: ProjectOptions;
    /**
     * Рабочая директория проекта.
     */
    readonly dir: FileSystemDir;
    /**
     * Диагностические данные.
     */
    readonly diag: ProjectDiag;

    /**
     * Проект запущен? / Проект приостановлен? / Проект закрыт? / Проект
     * свалился с ошибкой виртуальной машины?
     */
    readonly state: "playing" | "paused" | "closed" | "error";

    /**
     * Планировщик цикла выполнения вычислений виртуальной машины.
     */
    computer: Executor;

    /**
     * Запускает выполнение проекта.
     * @param container - HTML элемент, в котором будут размещаться
     * открываемые в проекте окна.
     * Если он не указан, окна будут всплывающими.
     */
    play(container?: HTMLElement): this;
    /**
     * Запускает выполнение проекта.
     * @param host - Хост оконной системы.
     */
    play(host: WindowHost): this;
    /**
     * Закрывает проект.
     */
    close(): this;
    /**
     * Ставит проект на паузу.
     */
    pause(): this;
    /**
     * Продолжает выполнение проекта.
     */
    continue(): this;
    /**
     * Выполняет один шаг.
     */
    step(): this;

    /**
     * Регистрирует обработчик события закрытия проекта
     * (вызов функции CloseAll).
     */
    on(event: "closed", handler: () => void): this;
    /**
     * Разрегистрирует обработчик события закрытия проекта
     * (вызов функции CloseAll).
     * @param handler Если обработчик не указан, разрегистрируются все
     * обработчики данного события.
     */
    off(event: "closed", handler?: () => void): this;
    /**
     * Регистрирует обработчик события ошибки виртуальной машины.
     */
    on(event: "error", handler: (err: string) => void): this;
    /**
     * Разрегистрирует обработчик события ошибки виртуальной машины.
     * @param handler Если обработчик не указан, разрегистрируются все
     * обработчики данного события.
     */
    off(event: "error", handler?: (err: string) => void): this;
}

/**
 * Планировщик цикличного выполнения функции.
 */
export interface Executor {
    /**
     * Цикл выполнения запущен?
     */
    readonly running: boolean;
    /**
     * Планирует цикличный вызов функции.
     * @param callback Функция, которая должна вызываться циклично.
     * Если она возвращает false, цикл выполнения прерывается.
     */
    run(callback: () => boolean): void;
    /**
     * Прерывает цикл выполнения.
     */
    stop(): void;
}

export interface ProjectDiag {
    readonly iterations: number;
    readonly missingCommands: { name: string; classNames: string[] }[];
}

export interface WindowOptions {
    view: HTMLDivElement;
    /**
     * Название открываемого окна.
     */
    title?: string;
}

/**
 * Хост оконной системы.
 */
export interface WindowHost {
    /**
     * Параметры рабочей области.
     */
    readonly width: number;
    readonly height: number;
    window(options: WindowOptions): WindowHostWindow;
}

export interface WindowHostWindow {
    setTitle(title: string): void;
    setSize(width: number, height: number): void;
    /**
     * Регистрирует обработчик события изменения размера окна пользователем.
     */
    // on(event: "resized", handler: (width: number, height: number) => void): void;
    /**
     * Разрегистрирует обработчик события изменения размера окна пользователем.
     * @param handler Если обработчик не указан, разрегистрируются все
     * обработчики данного события.
     */
    // off(event: "resized", handler?: (width: number, height: number) => void): void;
    /**
     * Регистрирует обработчик события изменения закрытия окна пользователем.
     */
    on(event: "closed", handler: () => void): void;
    /**
     * Разрегистрирует обработчик события изменения закрытия окна пользователем.
     * @param handler Если обработчик не указан, разрегистрируются все
     * обработчики данного события.
     */
    off(event: "closed", handler?: () => void): void;

    toTop(): void;
    /**
     * Закрывает окно.
     */
    close(): void;
}
// export const fs: FileSystemConstructor;

export const unzip: ZipFSConstructor = createZipFS;

// export interface Logger {
//     info(msg: string): void;
//     warn(msg: string): void;
//     err(msg: string): void;
// }

export const options: {
    /**
     * URL каталога иконок.
     */
    iconsLocation?: string;
} = {};

const origL = console.log;
export function setLogLevel(logLevel: "err" | "full") {
    console.log = logLevel === "err" ? function () {} : origL;
}
setLogLevel("err");

export interface ExecutorConstructor {
    new (args?: any): Executor;
}

export const SmoothExecutor: ExecutorConstructor = SmoothComputer;
export const FastestExecutor: ExecutorConstructor = FastestComputer;

/**
 * Версия API.
 */
export const version: string = "0.7.1";
