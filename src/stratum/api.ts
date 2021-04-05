import { RealPlayer } from "./player";

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
    (source: ZipSource, options?: OpenZipOptions): Promise<DirInfo>;
}

export interface PlayerOptions {
    /**
     * Запрещает проекту изменять размеры главного окна.
     */
    disableWindowResize?: boolean;
}

interface BaseInfo {
    dirs(dirs: DirInfo[]): DirsInfo;
    files(files: FileInfo[]): FileArrayInfo;
}

/**
 * Представляет информацию о каталоге.
 */
export interface DirInfo extends BaseInfo {
    /**
     * Абсолютный путь в DOS-формате, включая префикс диска.
     */
    readonly path: string;
    /**
     * Возвращает информацию о файле относительно текущего каталога.
     * @param path - нечувствительный к регистру относительный или абсолютный
     * путь к искомому файлу или каталогу.
     */
    file(path: string): FileInfo;
    /**
     * Возвращает информацию о каталоге относительно текущего каталога.
     * @param path - нечувствительный к регистру относительный или абсолютный
     * путь к искомому файлу или каталогу.
     */
    dir(path: string): DirInfo;

    /**
     * Создает каталог.
     * @returns Был ли создан каталог?
     */
    create(): Promise<boolean>;
}

/**
 * Представляет информацию о группе каталогов.
 */
export interface DirsInfo extends ArrayLike<DirInfo>, BaseInfo {
    /**
     * Возвращает информацию о `.cls` файлах в каталогах.
     * @param recursive - рекурсивный поиск (по умолчанию - да)
     */
    searchClsFiles(recursive: boolean): Promise<FileArrayInfo>;
}

/**
 * Представляет информацию о файле.
 */
export interface FileInfo extends BaseInfo {
    /**
     * Абсолютный путь в DOS-формате, включая префикс диска.
     */
    readonly path: string;
    /**
     * Информация о родительском каталоге.
     */
    parent(): DirInfo;
    /**
     * Файл существует?
     */
    exist(): Promise<boolean>;
    /**
     * Возвращает содержимое файла или `null` если он не существует.
     */
    arraybuffer(): Promise<ArrayBuffer | null>;
    /**
     * Создает файл.
     * @returns Был ли создан файл?
     */
    create(): Promise<boolean>;
    /**
     * Заполняет существуюший файл содержимым.
     * @returns - удалось ли записать данные в файл?
     */
    write(data: ArrayBuffer): Promise<boolean>;
}

/**
 * Представляет информацию о группе файлов.
 */
export interface FileArrayInfo extends ArrayLike<FileInfo>, BaseInfo {
    /**
     * Для каждого файла возвращает его содержимое или `null` если он не существует.
     */
    arraybuffers(): Promise<(ArrayBufferView | null)[]>;
}

/**
 * Проект.
 */
export interface Player {
    /**
     * Опции проекта.
     */
    readonly options: PlayerOptions;
    /**
     * Диагностические данные.
     */
    readonly diag: PlayerDiag;

    /**
     * Проект запущен? / Проект приостановлен? / Проект закрыт? / Проект
     * свалился с ошибкой виртуальной машины?
     */
    readonly state: "playing" | "paused" | "closed" | "error";

    /**
     * Планировщик цикла выполнения вычислений виртуальной машины.
     */
    // computer: Executor;

    /**
     * Запускает выполнение п роекта.
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

export interface PlayerDiag {
    readonly iterations: number;
}

export interface WindowOptions {
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
    readonly width?: number;
    readonly height?: number;
    window(view: HTMLDivElement, options: WindowOptions): WindowHostWindow;
}

export interface WindowHostWindow {
    setTitle?(title: string): void;
    setSize?(width: number, height: number): void;
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
    on?(event: "closed", handler: () => void): void;
    /**
     * Разрегистрирует обработчик события изменения закрытия окна пользователем.
     * @param handler Если обработчик не указан, разрегистрируются все
     * обработчики данного события.
     */
    off?(event: "closed", handler?: () => void): void;

    toTop?(): void;
    /**
     * Закрывает окно.
     * @remarks При этом не должно вызываться событие closed.
     */
    close(): void;
}

export interface AddDirInfo {
    dir: DirInfo;
    loadClasses: boolean;
    type?: "library" | "temp";
}

/**
 * Создает новый проект из файла.
 * @param dirInfo - настройки директорий проекта, дополнительные пути поиска имиджей.
 */
export function project(prjFile: FileInfo, dirInfo?: AddDirInfo[]): Promise<Player> {
    return RealPlayer.create(prjFile, dirInfo);
}

// export const fs: FileSystemConstructor;

// export const unzip: ZipFSConstructor = createZipFS;

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

export function setLogLevel(logLevel: "err" | "full") {
    // console.log = logLevel === "err" ? function () {} : origL;
}

// export interface ExecutorConstructor {
//     new (args?: any): Executor;
// }

// export const SmoothExecutor: ExecutorConstructor = SmoothComputer;
// export const FastestExecutor: ExecutorConstructor = FastestComputer;

/**
 * Версия API.
 */
export const version: string = "0.10.0";
