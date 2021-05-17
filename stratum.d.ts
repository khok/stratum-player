/**
 * Общие операции над файлами и каталогами.
 */

export interface PathInfo {
    readonly fs: FileSystem;
    readonly vol: string;
    readonly parts: ReadonlyArray<string>;
    resolve(path: string): PathInfo;
    toString(): string;
}

export interface ReadWriteFile {
    read(): Promise<ArrayBuffer | ArrayBufferView | null>;
    /**
     * Заполняет существуюший файл содержимым.
     * @returns - удалось ли записать данные в файл?
     */
    write(data: ArrayBuffer): Promise<boolean>;
}

export interface FileSystem {
    /**
     * Возвращает информацию о `.cls` файлах в указанных каталогах.
     * @param recursive - рекурсивный поиск (по умолчанию - да)
     */
    searchClsFiles(paths: PathInfo[], recursive: boolean): Promise<PathInfo[]>;
    /**
     * Для каждого файла возвращает его содержимое или `null` если он не существует.
     */
    arraybuffers(paths: PathInfo[]): Promise<(ArrayBuffer | ArrayBufferView | null)[]>;
    /**
     * Создает каталог.
     * @returns Был ли создан каталог?
     */
    createDir(path: PathInfo): Promise<boolean>;

    /**
     * Файл существует?
     */
    fileExist(path: PathInfo): Promise<boolean>;

    /**
     * Возвращает содержимое файла или `null` если он не существует.
     */
    file(path: PathInfo): ReadWriteFile | null;

    /**
     * Возвращает содержимое файла или `null` если он не существует.
     */
    arraybuffer(path: PathInfo): Promise<ArrayBuffer | ArrayBufferView | null>;
    /**
     * Создает файл.
     * @returns Был ли создан файл?
     */
    createFile(path: PathInfo): Promise<ReadWriteFile | null>;
}

export interface PlayerOptions {}

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
    speed(speed: "fast" | "smooth", cycles?: number): this;

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

export interface WindowRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface WindowOptions {
    type: "mdi" | "popup" | "dialog";
    /**
     * Размеры окна.
     */
    rect?: WindowRect;
    /**
     * Заголовок открываемого окна.
     */
    title?: string;
    /**
     * Спрятать заголовок?
     */
    noCaption?: boolean;
}

/**
 * Хост оконной системы.
 */
export interface WindowHost {
    /**
     * Ширина рабочей области.
     */
    readonly width?: number;
    /**
     * Высота рабочей области.
     */
    readonly height?: number;
    /**
     * Создает новое окно с указанным элементом `view`.
     */
    window(view: HTMLDivElement, options: WindowOptions): WindowHostWindow;
}

export interface WindowHostWindow {
    /**
     * Закрывает окно.
     * @remarks При этом не должно вызываться событие closed.
     */
    close?(): void;
    /**
     * Изменяет заголовок окна.
     * @param title
     */
    setTitle?(title: string): void;
    /**
     * Устанавливает желаемое расположение окна.
     */
    setPosition?(x: number, y: number): void;
    /**
     * Устанавливает желаемые размеры окна.
     */
    setSize?(width: number, height: number): void;
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

    /**
     * Перемещает окно наверх.
     */
    toTop?(): void;
}

export interface AddDirInfo {
    dir: PathInfo;
    loadClasses: boolean;
    type?: "library" | "temp";
}

export interface PlayerConstructor {
    /**
     * Создает новый проект из файла.
     * @param dirInfo - настройки директорий проекта, дополнительные пути поиска имиджей.
     */
    (prjFile: PathInfo, dirInfo?: AddDirInfo[]): Promise<Player>;
}

export interface ZipFS extends FileSystem {
    merge(fs: ZipFS): this;
    files(regexp?: RegExp): IterableIterator<PathInfo>;
    path(path: string): PathInfo;
}

export type ZipSource = File | Blob | ArrayBuffer | Uint8Array;
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
export interface ZipFSConstructor {
    /**
     * Создает файловую систему.
     * @param source - Источник ZIP-архива.
     */
    (source: ZipSource, options?: OpenZipOptions): Promise<ZipFS>;
}

export interface GoldenWSConstructor {
    /**
     * Создает оконную систему.
     * @param source - корневой элемент оконной системы.
     */
    (element?: HTMLElement): WindowHost;
}

export interface StratumOptions {
    /**
     * URL каталога иконок.
     */
    iconsLocation?: string;
    log: (...data: any[]) => any;
}

export interface Stratum {
    player?: PlayerConstructor;
    unzip?: ZipFSConstructor;
    goldenws?: GoldenWSConstructor;
    options?: StratumOptions;
    /**
     * Версия API.
     */
    version?: string;
}

declare global {
    export var stratum: Stratum | undefined;
}
