import { createWS } from "stratum/graphics/windowSystems";
import { createZipFS } from "stratum/vfs";

export interface FileSystemConstructor {
    (): FileSystem;
}

export interface ZipFsOptions {
    /**
     * Кодировка имен файлов в архиве (по умолчанию: cp866).
     */
    encoding?: string;
}

export interface ZipFsConstructor {
    /**
     * Создает новую файловую систему из указанных источников ZIP-архивов.
     * @param source Источник ZIP-архива.
     * @param options Опции ZIP-архива.
     */
    (source: Blob | ArrayBuffer, options?: ZipFsOptions): Promise<FileSystem>;
}

/**
 * Файловая система.
 */
export interface FileSystem {
    /**
     * Встраивает содержимое другой файловой системы в заданый каталог.
     */
    mount(fs: this, path?: string): this;

    // search(endsWith: string, directory?: string | string[]): FileSystemFile[];
    /**
     * Возвращает список файлов, попадающих под условия поиска.
     */
    search(regexp: RegExp): FileSystemFile[];
    /**
     * Возвращает список файлов в указанной директории.
     * Если директория не указана, возвращает все файлы в системе.
     */
    files(directory?: string): FileSystemFile[];
    /**
     * Возвращает файл с указанным именем.
     */
    file(filename: string): FileSystemFile | undefined;
    /**
     * Открывает проект.
     */
    project(options?: ProjectOptions): Promise<Project>;
}

/**
 * Представляет файл в файловой системе.
 */
export interface FileSystemFile {
    /**
     * Имя файла.
     */
    readonly path: string;
    /**
     * Явно предзагружает содержимое файла.
     * Только явно предзагруженные файлы могут быть прочитаны в процессе исполнения проекта.
     * В противном случае будет создано исключение.
     */
    makeSync(): Promise<void>;
    /**
     * Распаковывает файл.
     * Не делает файл явно предзагруженным.
     * Для этого явно используется @method makeSync.
     */
    arraybuffer(): Promise<ArrayBuffer>;
}

export interface ProjectOptions {
    /**
     * Завершающая часть пути к файлу проекта.
     */
    path?: string;
    /**
     * Дополнительные пути поиска файлов имиджей.
     */
    additionalClassPaths?: string[];

    firstMatch?: boolean;
}

/**
 * Проект
 */
export interface Project {
    /**
     * Диагностические данные.
     */
    readonly diag: ProjectDiag;

    /**
     * Проект запущен? / Проект приостановлен? / Проект закрыт?
     */
    readonly state: "playing" | "paused" | "closed";

    /**
     * Планировщик цикла выполнения вычислений виртуальной машины.
     */
    computer: Executor;

    /**
     * Запускает выполнение проекта.
     * @param ws Используемая оконная система.
     */
    play(ws?: WindowSystem): this;
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
     * Цикл запущен?
     */
    readonly running: boolean;
    /**
     * Планирует цикличный вызов функции.
     * @param callback Функция, которая должна вызываться циклично.
     */
    run(callback: () => void): void;
    /**
     * Останавливает цикл выполнения.
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

// export interface WindowHostGraphicsWindow extends WindowHostWindow {
//     renderer: unknown;
// }

export interface WindowSystemOptions {
    screenWidth?: number;
    screenHeight?: number;
    areaOriginX?: number;
    areaOriginY?: number;
    areaWidth?: number;
    areaHeight?: number;
    globalCanvas?: HTMLCanvasElement;
    htmlRoot?: HTMLElement;
    disableSceneResize?: boolean;
}

export interface WindowSystemConstructor {
    /**
     * Создает простой оконный хост.
     * @param options Опции хоста.
     */
    (options?: WindowSystemOptions): WindowSystem;
}

/**
 * Старый вариант оконной системы.
 */
export interface WindowSystem {
    readonly screenWidth: number;
    readonly screenHeight: number;
    readonly areaOriginX: number;
    readonly areaOriginY: number;
    readonly areaWidth: number;
    readonly areaHeight: number;

    createWindow(name: string): WindowSystemWindow;
    redraw(): void;
    closeAll(): void;
}

/**
 * Старый вариант окна оконной системы.
 */
export interface WindowSystemWindow {
    /**
     * Пока незадокументировал.
     */
    readonly renderer: any; //FIXME
    readonly name: string;

    readonly originX: number;
    readonly originY: number;
    setOrigin(x: number, y: number): void;
    originChanged?: (x: number, y: number) => void;

    readonly width: number;
    readonly height: number;
    setSize(width: number, height: number): void;
    sizeChanged?: (x: number, y: number) => void;

    close(): void;
}

// export declare const fs: FileSystemConstructor;

export const unzip: ZipFsConstructor = createZipFS;
export const ws: WindowSystemConstructor = createWS;

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
export const version: string = "1.0.0";
