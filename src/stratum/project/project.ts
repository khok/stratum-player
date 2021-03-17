import { ClassLibrary } from "stratum/common/classLibrary";
import { VarType } from "stratum/common/varType";
import { Env, Enviroment, NumBool } from "stratum/env";
import { ProjectInfo } from "stratum/fileFormats/prj";
import { VariableSet } from "stratum/fileFormats/stt";
import { unreleasedFunctions } from "stratum/translator/unreleasedFunctions";
import { VFSDir } from "stratum/vfs";
import { Schema } from "./schema";

export interface ProjectResources {
    dir: VFSDir;
    prjInfo: ProjectInfo;
    classes: ClassLibrary;
    stt?: VariableSet;
}

export class Project implements Env.Project, Env.HyperTarget {
    private level: number;
    private shouldClose: boolean;
    private schema: Schema;

    readonly env: Enviroment;
    readonly dir: VFSDir;

    readonly oldFloats: Env.Farr;
    readonly newFloats: Env.Farr;

    readonly oldInts: Int32Array;
    readonly newInts: Int32Array;

    readonly oldStrings: string[];
    readonly newStrings: string[];

    readonly olds: { [index: number]: Env.Farr | Int32Array | string[] };
    readonly news: { [index: number]: Env.Farr | Int32Array | string[] };

    constructor(env: Enviroment, args: ProjectResources) {
        this.level = 0;
        this.shouldClose = false;
        this.env = env;
        this.dir = args.dir;

        unreleasedFunctions.clear();
        const schema = (this.schema = Schema.build(args.prjInfo.rootClassName, args.classes, this));
        if (unreleasedFunctions.size > 0) console.log(`Нереализованные функции:\n${[...unreleasedFunctions.values()].join("\n")}`);
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
    }

    stratum_closeAll(): void {
        this.shouldClose = true;
    }

    hyperCall(mode: number, args: string[]): Promise<void> {
        return this.env.hyperCall(this.dir, mode, args);
    }

    stratum_openSchemeWindow(wname: string, className: string, attrib: string): number {
        return this.env.openSchemeWindow(this, wname, className, attrib);
    }

    stratum_loadSpaceWindow(wname: string, fileName: string, attrib: string): number {
        return this.env.loadSpaceWindow(this, wname, fileName, attrib);
    }

    stratum_createWindowEx(wname: string, parentWname: string, source: string, x: number, y: number, w: number, h: number, attrib: string): number {
        return this.env.createWindowEx(this, wname, parentWname, source, x, y, w, h, attrib);
    }

    stratum_createDIB2d(hspace: number, fileName: string): number {
        return this.env.createDIB2d(this.dir, hspace, fileName);
    }

    stratum_createDoubleDib2D(hspace: number, fileName: string): number {
        return this.env.createDoubleDib2D(this.dir, hspace, fileName);
    }

    stratum_createObjectFromFile2D(hspace: number, fileName: string, x: number, y: number, flags: number): number {
        return this.env.createObjectFromFile2D(this.dir, hspace, fileName, x, y, flags);
    }

    stratum_createStream(type: string, name: string, flags: string): number {
        return this.env.createStream(this.dir, type, name, flags);
    }

    stratum_mSaveAs(q: number, fileName: string, flag: number): NumBool {
        return this.env.mSaveAs(this.dir, q, fileName, flag);
    }

    stratum_mLoad(q: number, fileName: string, flag: number): number {
        return this.env.mLoad(this.dir, q, fileName, flag);
    }

    stratum_createDir(name: string): NumBool {
        return this.dir.create("dir", name) ? 1 : 0;
    }

    stratum_fileExist(fileName: string): NumBool {
        const file = this.dir.get(fileName);
        return typeof file !== "undefined" ? 1 : 0;
    }
    stratum_getProjectDirectory(): string {
        return this.dir.pathDos;
    }

    stop(): void {
        this.shouldClose = true;
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

    syncLocal(ids: Uint16Array): void {
        // prettier-ignore
        const { newFloats, oldFloats,newInts,oldInts,newStrings,oldStrings } = this;
        // Синхронизируем измененные в ходе вычислений переменные только на этом промежутке,
        // чтобы не гонять env.sync()
        for (const id of ids) {
            oldFloats[id] = newFloats[id];
            oldInts[id] = newInts[id];
            oldStrings[id] = newStrings[id];
        }
    }

    syncAll(): this {
        this.oldFloats.set(this.newFloats);
        this.oldInts.set(this.newInts);
        for (let i = 0; i < this.newStrings.length; ++i) this.oldStrings[i] = this.newStrings[i];
        return this;
    }

    /**
     * Проверка, не было ли изменено (в результате багов) зарезервированное значение.
     */
    private assertZeroIndexEmpty(): void {
        if (
            this.oldFloats[0] !== 0 ||
            "undefined" in this.oldFloats ||
            this.newFloats[0] !== 0 ||
            "undefined" in this.newFloats ||
            this.oldInts[0] !== 0 ||
            "undefined" in this.oldInts ||
            this.newInts[0] !== 0 ||
            "undefined" in this.newInts ||
            this.oldStrings[0] !== "" ||
            "undefined" in this.oldStrings ||
            this.newStrings[0] !== "" ||
            "undefined" in this.newStrings
        )
            throw Error("Было изменено зарезервированное значение переменной");
    }

    compute(): boolean {
        this.schema.compute();
        this.syncAll().assertZeroIndexEmpty();
        return !this.shouldClose;
    }
}
