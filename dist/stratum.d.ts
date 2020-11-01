export interface FileSystemConstructor {
    (): FileSystem;
}
export interface OpenZipOptions {
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
 * Представляет файл в файловой системе.
 */
export interface FileSystemFile {
    readonly pathDos: string;
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
export interface OpenProjectOptions {
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
export interface ProjectPlayOptions {
    mainWindowContainer?: HTMLElement;
    disableWindowResize?: boolean;
    width?: number;
    height?: number;
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
    readonly missingCommands: {
        name: string;
        classNames: string[];
    }[];
}
export declare const unzip: ZipFSConstructor;
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
