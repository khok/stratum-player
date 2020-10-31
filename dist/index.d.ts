export interface FileSystemConstructor {
    (): FileSystem;
}
export interface ZipFsOptions {
    /**
     * Директория, в которую монтируется содержимое архива.
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
export interface ZipFsConstructor {
    /**
     * Создает новую файловую систему из указанных источников ZIP-архивов.
     * @param source Источник ZIP-архива.
     * @param options Опции ZIP-архива.
     */
    (source: File | Blob | ArrayBuffer, options?: ZipFsOptions): Promise<FileSystem>;
}
/**
 * Файловая система.
 */
export interface FileSystem {
    /**
     * Объединяет содержимое двух файловых систем.
     */
    merge(fs: this): this;
    /**
     * Возвращает список файлов, попадающих под условия поиска.
     */
    search(regexp: RegExp): IterableIterator<FileSystemFile>;
    /**
     * Открывает проект.
     */
    project(options?: ProjectOpenOptions): Promise<Project>;
}
/**
 * Представляет файл в файловой системе.
 */
export interface FileSystemFile {
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
export interface ProjectOpenOptions {
    /**
     * Завершающая часть пути к файлу проекта.
     */
    tailPath?: string;
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
    readonly missingCommands: {
        name: string;
        classNames: string[];
    }[];
}
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
    readonly renderer: any;
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
export declare const unzip: ZipFsConstructor;
export declare const ws: WindowSystemConstructor;
export declare const options: {
    /**
     * URL каталога иконок.
     */
    iconsLocation: string;
};
/**
 * Версия API.
 */
export declare const version: string;
export as namespace stratum;
