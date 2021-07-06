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

export interface ErrorHandler {
    (err: string): void;
}

export interface ShellHandler {
    (path: string, args: string, directory: string, flag: number): void;
}

export interface CursorRequestHandler {
    (path: string): string;
}

export interface PlayerDiag {
    readonly iterations: number;
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
    on(event: "closed", handler: Function): this;
    /**
     * Разрегистрирует обработчик события закрытия проекта
     * (вызов функции CloseAll).
     * @param handler Если обработчик не указан, разрегистрируются все
     * обработчики данного события.
     */
    off(event: "closed", handler?: Function): this;
    /**
     * Регистрирует обработчик события ошибки виртуальной машины.
     */
    on(event: "error", handler: ErrorHandler): this;
    /**
     * Разрегистрирует обработчик события ошибки виртуальной машины.
     * @param handler Если обработчик не указан, разрегистрируются все
     * обработчики данного события.
     */
    off(event: "error", handler?: ErrorHandler): this;
    /**
     * Регистрирует обработчик события shell.
     */
    on(event: "shell", handler: ShellHandler): this;
    /**
     * Разрегистрирует обработчик события shell.
     * @param handler Если обработчик не указан, разрегистрируются все
     * обработчики данного события.
     */
    off(event: "shell", handler?: ShellHandler): this;
    /**
     * Регистрирует резовер типа курсора.
     */
    on(event: "cursorRequest", handler: CursorRequestHandler): this;
    /**
     * Регистрирует резовер типа курсора.
     */
    off(event: "cursorRequest"): this;
}

export interface ViewContainerPosition {
    /**
     * Позиция по X.
     */
    x: number;
    /**
     * Позиция по Y.
     */
    y: number;
}

export interface ViewContainerSize {
    /**
     * Ширина клиентской части окна.
     */
    width: number;
    /**
     * Высота клиентской части окна.
     */
    height: number;
}

export interface ViewContainerOptions {
    /**
     * Начальное расположение окна.
     */
    position: ViewContainerPosition | null;
    /**
     * Начальные клиентские размеры окна.
     */
    size: ViewContainerSize | null;
    /**
     * Заголовок.
     */
    title: string | null;
    /**
     * Спрятать заголовок?
     */
    noCaption: boolean;
    /**
     * Окно является всплывающим?
     */
    isPopup: boolean;
    /**
     * Окно нельзя менять?
     */
    noResize: boolean;
    /**
     * Показывать вертикальную прокрутку?
     */
    vScroll: boolean;
    /**
     * Показывать горизонтальную прокрутку?
     */
    hScroll: boolean;
    /**
     * Окно не имеет тени?
     */
    noShadow: boolean;
}

export interface ViewContainerMoveCallback {
    (x: number, y: number): void;
}

export interface ViewContainerResizedCallback {
    (w: number, h: number): void;
}

export interface ViewContainerController {
    /**
     * Позиция окна по X.
     */
    originX?(): number;
    /**
     * Позиция окна по Y.
     */
    originY?(): number;
    /**
     * Устанавливает новое расположение окна.
     */
    setOrigin?(x: number, y: number): void;

    /**
     * Ширина окна.
     */
    width?(): number;
    /**
     * Высота окна.
     */
    height?(): number;
    /**
     * Устанавливает новые размеры окна.
     */
    setSize?(width: number, height: number): void;

    /**
     * Ширина клиентской области окна.
     */
    clientWidth?(): number;
    /**
     * Высота клиентской области окна.
     */
    clientHeight?(): number;
    /**
     * Устанавливает новые размеры клиентской области окна.
     */
    setClientSize?(width: number, height: number): void;

    /**
     * Закрывает окно.
     */
    close?(): void;

    /**
     * Устанавливает видимость окна.
     */
    setVisibility?(visible: boolean): void;

    /**
     * Перемещает окно поверх остальных.
     */
    toTop?(): void;
    /**
     * Устанавливает цвет и прозрачность окна.
     */
    setBackground?(r: number, g: number, b: number): void;
    setTransparent?(level: number): void;
    /**
     * Устанавливает заголовок окна.
     */
    setTitle?(title: string): void;

    /**
     * Регистрирует обработчик перемещения окна.
     */
    on?(event: "moved", callback: ViewContainerMoveCallback): void;
    /**
     * Регистрирует обработчик изменения размеров окна.
     */
    on?(event: "resized", callback: ViewContainerResizedCallback): void;
    /**
     * Регистрирует обработчик закрытия окна.
     */
    on?(event: "closed", callback: Function): void;

    /**
     * Разрегистрирует обработчик(и) перемещения окна.
     */
    off?(event: "moved", callback?: ViewContainerMoveCallback): void;
    /**
     * Разрегистрирует обработчик(и) изменения размеров окна.
     */
    off?(event: "resized", callback?: ViewContainerResizedCallback): void;
    /**
     * Разрегистрирует обработчик(и) закрытия окна.
     */
    off?(event: "closed", callback?: Function): void;
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
    append(view: Element, options: ViewContainerOptions): ViewContainerController;
}

export interface AddDirInfo {
    /**
     * Путь директории.
     */
    dir: PathInfo;
    /**
     * Тип директории ("library" - библиотека имиджей, "temp" - временная директория). По умолчанию - library.
     */
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
