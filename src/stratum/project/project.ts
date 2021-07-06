import { ClassLibrary } from "stratum/classLibrary";
import { NumBool } from "stratum/common/types";
import { VarType } from "stratum/common/varType";
import { installContextFunctions, ProjectContextFunctions, SchemaMemory } from "stratum/compiler";
import { unreleasedFunctions } from "stratum/compiler/unreleasedFunctions";
import { ProjectInfo } from "stratum/fileFormats/prj";
import { VariableSet } from "stratum/fileFormats/stt";
import { PathInfo } from "stratum/stratum";
import { EnviromentFunctions } from "./enviromentFunctions";
import { Schema } from "./schema";

/**
 * Ресурсы проекта.
 */
export interface ProjectArgs {
    /**
     * Рабочая директория проекта (т.е. в которой находится файл prj).
     * Относительно нее будут резолвиться открываемые файлы.
     */
    dir: PathInfo;
    /**
     * Содержимое prj-файла.
     */
    prjInfo: ProjectInfo;
    /**
     * Библиотека имиджей.
     */
    classes: ClassLibrary;
    /**
     * Путь к файлу проекта.
     */
    filepath: string;
    /**
     * Содержимое stt-файла.
     */
    stt?: VariableSet | null;
}

export class Project implements SchemaMemory, ProjectContextFunctions {
    private readonly olds: { [index: number]: Float64Array | Int32Array | string[] };
    private readonly news: { [index: number]: Float64Array | Int32Array | string[] };

    private level: number;
    private _shouldClose: boolean;

    readonly dir: PathInfo;

    readonly root: Schema;
    readonly env: EnviromentFunctions;

    readonly oldFloats: Float64Array;
    readonly newFloats: Float64Array;

    readonly oldInts: Int32Array;
    readonly newInts: Int32Array;

    readonly oldStrings: string[];
    readonly newStrings: string[];

    readonly filepath: string;

    /**
     * Создает новый экземпляр проекта.
     * @param env - окружение, в котором работает проект.
     * @param args - ресурсы проекта.
     */
    constructor(env: EnviromentFunctions, args: ProjectArgs) {
        this.level = 0;
        this._shouldClose = false;
        this.env = env;
        this.dir = args.dir;
        this.filepath = args.filepath;

        const rootProto = args.classes.get(args.prjInfo.rootClassName);
        if (!rootProto) throw Error(`Корневой имидж ${args.prjInfo.rootClassName} не найден`);

        unreleasedFunctions.clear();
        const schema = rootProto.schema<Schema>((...args) => new Schema(this, ...args));
        if (unreleasedFunctions.size > 0) {
            console.warn(`Нереализованные или необнаруженные функции (${unreleasedFunctions.size}):\n${[...unreleasedFunctions.values()].join("\n")}`);
        }
        const size = schema.createTLB(); // Инициализируем память

        this.oldFloats = new Float64Array(size.floatsCount);
        this.newFloats = new Float64Array(size.floatsCount);

        this.oldInts = new Int32Array(size.intsCount);
        this.newInts = new Int32Array(size.intsCount);

        this.oldStrings = new Array<string>(size.stringsCount).fill("");
        this.newStrings = new Array<string>(size.stringsCount).fill("");

        this.olds = [];
        this.olds[VarType.Float] = this.oldFloats;
        this.olds[VarType.Handle] = this.oldInts;
        this.olds[VarType.ColorRef] = this.oldInts;
        this.olds[VarType.String] = this.oldStrings;

        this.news = [];
        this.news[VarType.Float] = this.newFloats;
        this.news[VarType.Handle] = this.newInts;
        this.news[VarType.ColorRef] = this.newInts;
        this.news[VarType.String] = this.newStrings;

        schema.applyDefaults(); //Заполняем значениями по умолчанию
        if (args.stt) schema.applyVarSet(args.stt); // Применяем _preload.stt
        this.root = schema;
    }

    canExecute(): boolean {
        return this.level < 59;
    }

    inc(): void {
        ++this.level;
    }

    dec(): void {
        --this.level;
    }

    setOldValue(index: number, type: VarType, value: number | string): void {
        this.olds[type][index] = value;
    }
    setNewValue(index: number, type: VarType, value: number | string): void {
        this.news[type][index] = value;
    }
    getNewValue(index: number, type: VarType): number | string {
        return this.news[type][index];
    }

    shouldClose(): boolean {
        return this._shouldClose;
    }

    //#region Реализации функций.
    stratum_closeAll(): void {
        this._shouldClose = true;
    }

    stratum_openSchemeWindow(wname: string, className: string, attrib: string): number {
        return this.env.openSchemeWindow(this, wname, className, attrib);
    }

    stratum_async_loadSpaceWindow(wname: string, fileName: string, attrib: string): number | Promise<number> {
        return this.env.loadSpaceWindow(this, wname, fileName, attrib);
    }

    stratum_async_createWindowEx(
        wname: string,
        parentWname: string,
        source: string,
        x: number,
        y: number,
        w: number,
        h: number,
        attrib: string
    ): number | Promise<number> {
        return this.env.createWindowEx(this, wname, parentWname, source, x, y, w, h, attrib);
    }

    stratum_async_createDIB2d(hspace: number, fileName: string): number | Promise<number> {
        return this.env.createDIB2d(this.dir, hspace, fileName);
    }

    stratum_async_createDoubleDib2D(hspace: number, fileName: string): number | Promise<number> {
        return this.env.createDoubleDib2D(this.dir, hspace, fileName);
    }

    stratum_loadCursor(wnameOrHspace: string | number, filename: string): void {
        this.env.loadCursor(this.dir, wnameOrHspace, filename);
    }

    stratum_async_createObjectFromFile2D(hspace: number, fileName: string, x: number, y: number, flags: number): number | Promise<number> {
        return this.env.createObjectFromFile2D(this.dir, hspace, fileName, x, y, flags);
    }

    stratum_async_createStream(type: string, name: string, flags: string): number | Promise<number> {
        return this.env.createStream(this.dir, type, name, flags);
    }

    stratum_async_mSaveAs(q: number, fileName: string, flag: number): NumBool | Promise<NumBool> {
        return this.env.mSaveAs(this.dir, q, fileName, flag);
    }

    stratum_async_mLoad(q: number, fileName: string, flag: number): number | Promise<number> {
        return this.env.mLoad(this.dir, q, fileName, flag);
    }

    async stratum_async_createDir(name: string): Promise<NumBool> {
        const dir = this.dir.resolve(name);
        const r = await dir.fs.createDir(dir);
        return r ? 1 : 0;
    }

    async stratum_async_fileExist(fileName: string): Promise<NumBool> {
        const file = this.dir.resolve(fileName);
        const r = await file.fs.fileExist(file);
        return r ? 1 : 0;
    }

    stratum_getProjectDirectory(): string {
        return this.dir.toString();
    }
    //#endregion
}
installContextFunctions(Project, "prj");
