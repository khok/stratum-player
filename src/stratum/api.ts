import { createZipFS } from "stratum/vfs";

export interface FileSystemConstructor {
    (): FileSystem;
}

export interface OpenZipOptions {
    /**
     * Каталог, в которую монтируется содержимое архива.
     * Может начинаться с префикса диска, например, `C:/Projects`
     * Если префикс не указан, то он автоматически устанавливается как `Z:`
     * @default "Z:"
     */
    directory?: string;
    /**
     * Кодировка файловых путей.
     * @default "cp866"
     */
    encoding?: string;
}

export interface ZipFSConstructor {
    /**
     * Создает новую файловую систему из указанных источников ZIP-архивов.
     * @param source Источник ZIP-архива.
     * @param options Опции распаковки ZIP-архива.
     */
    (source: File | Blob | ArrayBuffer, options?: OpenZipOptions): Promise<FileSystem>;
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
     * Возвращает список файлов, попадающих под условия поиска.
     */
    search(regexp: RegExp): IterableIterator<FileSystemFile>;
    /**
     * Открывает проект.
     */
    project(options?: OpenProjectOptions): Promise<Project>;
}

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
     * Возвращает файл или каталог относительно текущего каталога.
     * @param path - нечувствительный к регистру относительный или абсолютный
     * путь к искомому файлу или каталогу.
     */
    get(path: string): FileSystemDir | FileSystemFile | undefined;
    /**
     * Пытается создать файл.
     * @param path - нечувствительный к регистру относительный или абсолютный
     * путь к искомому файлу.
     * Если файл или каталог с указанным именем не удалось создать, возвращает undefined.
     */
    fileNew(path: string, data: ArrayBuffer): FileSystemFile | undefined;
    /**
     * Пытается создать каталог.
     * @param path - нечувствительный к регистру относительный или абсолютный
     * путь к создаваемому каталогу.
     * Если каталог с указанным именем не удалось создать, возвращает undefined.
     */
    folderNew(path: string): FileSystemDir | undefined;
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
     * Только явно предзагруженные файлы могут быть прочитаны в процессе исполнения проекта.
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

export interface OpenProjectOptions {
    /**
     * Дополнительные пути поиска файлов имиджей.
     */
    additionalClassPaths?: string[];

    /**
     * Завершающая часть пути к файлу проекта.
     */
    tailPath?: string;

    /**
     * Открывать первый найденный файл проекта.
     */
    firstMatch?: boolean;
}

export interface ProjectPlayOptions {
    /**
     * Контейнер главного окна проекта.
     */
    mainWindowContainer?: HTMLElement;
    /**
     * Запрещает проекту изменять размеры главного окна.
     */
    disableWindowResize?: boolean;
    /**
     * Произвольные размеры открываемого главного окна.
     * По умолчанию открываемое окно занимает все доступную длину и ширину контейнера.
     */
    customRes?: {
        width?: number;
        height?: number;
    };
}

/**
 * Проект
 */
export interface Project {
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
     * @param mainWindowContainer - HTML элемент, к которому будет привязано
     * открываемое окно с проектом.
     */
    play(mainWindowContainer?: HTMLElement): this;
    play(options?: ProjectPlayOptions): this;
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
     * Регистрирует обработчик события закрытия проекта (вызов функции CloseAll).
     */
    on(event: "closed", handler: () => void): this;
    /**
     * Разегистрирует обработчик события закрытия проекта (вызов функции CloseAll).
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

// export interface WindowOptions {
//     /**
//      * Имя открытого окна.
//      */
//     title?: string;
// }

// /**
//  * Хост оконной системы.
//  */
// export interface WindowHost {
//     /**
//      * Разрешение экрана.
//      */
//     readonly resolution: {
//         readonly width: number;
//         readonly height: number;
//     };
//     /**
//      * Параметры рабочей области.
//      */
//     readonly area: {
//         readonly x: number;
//         readonly y: number;
//         readonly width: number;
//         readonly height: number;
//     };

//     /**
//      * Создает или возвращает уже открытое графическое окно с заданным идентификатором.
//      * @param key Идентификатор окна.
//      */
//     graphicsWindow(key: string, options?: WindowOptions): WindowHostGraphicsWindow;
//     /**
//      * Возвращает графическое окно по заданному идентификатору.
//      * @param key Идентификатор окна
//      */
//     getGraphicsWindow(key: string): WindowHostGraphicsWindow | undefined;
// }

// export interface WindowHostWindow {
//     /**
//      * Имя окна.
//      */
//     title: string;
//     /**
//      * Область окна.
//      */
//     area: {
//         x: number;
//         y: number;
//         width: number;
//         height: number;
//     };

//     /**
//      * Загружены ли ресурсы окна?
//      */
//     readonly loaded: boolean;

//     /**
//      * Регистрирует обработчик события загрузки ресурсов окна.
//      */
//     on(event: "loaded", handler: () => void): void;
//     /**
//      * Разегистрирует обработчик события загрузки ресурсов окна.
//      * @param handler Если обработчик не указан, разрегистрируются все
//      * обработчики данного события.
//      */
//     off(event: "loaded", handler?: () => void): void;
//     /**
//      * Регистрирует обработчик события перемещения окна пользователем.
//      */
//     on(event: "moved", handler: (x: number, y: number) => void): void;
//     /**
//      * Разегистрирует обработчик события перемещения окна пользователем.
//      * @param handler Если обработчик не указан, разрегистрируются все
//      * обработчики данного события.
//      */
//     off(event: "moved", handler?: (x: number, y: number) => void): void;
//     /**
//      * Регистрирует обработчик события изменения размера окна пользователем.
//      */
//     on(event: "resized", handler: (width: number, height: number) => void): void;
//     /**
//      * Разегистрирует обработчик события изменения размера окна пользователем.
//      * @param handler Если обработчик не указан, разрегистрируются все
//      * обработчики данного события.
//      */
//     off(event: "resized", handler?: (width: number, height: number) => void): void;
//     /**
//      * Регистрирует обработчик события изменения закрытия окна пользователем.
//      */
//     on(event: "closed", handler: () => void): void;
//     /**
//      * Разегистрирует обработчик события изменения закрытия окна пользователем.
//      * @param handler Если обработчик не указан, разрегистрируются все
//      * обработчики данного события.
//      */
//     off(event: "closed", handler?: () => void): void;

//     /**
//      * Закрывает окно.
//      */
//     close(): void;
// }
// export const fs: FileSystemConstructor;

export const unzip: ZipFSConstructor = createZipFS;

export const options: {
    /**
     * URL каталога иконок.
     */
    iconsLocation: string;
} = {
    iconsLocation: "/data/icons",
};

/**
 * Версия API.
 */
export const version: string = "0.4.0";
