import { Project, ProjectOptions, SmoothExecutor, WindowHost } from "stratum/api";
import { ClassLibrary } from "stratum/common/classLibrary";
import { ProjectInfo } from "stratum/fileFormats/prj";
import { VariableSet } from "stratum/fileFormats/stt";
import { GraphicsManager } from "stratum/graphics";
import { Schema } from "stratum/schema";
import { Enviroment, NumBool, ProjectFunctions } from "stratum/translator";
import { unreleasedFunctions } from "stratum/translator/translator";
import { VFSDir } from "stratum/vfs";
import { MemoryManager } from "./memoryManager";
import { SimpleWs } from "./ws";

export interface ProjectResources {
    dir: VFSDir;
    prjInfo: ProjectInfo;
    classes: ClassLibrary;
    stt?: VariableSet;
    options?: ProjectOptions;
}

export class Player implements Project, ProjectFunctions {
    private shouldClose = false;
    private _state: Project["state"] = "closed";
    private readonly _diag = { iterations: 0, missingCommands: [] };
    private _computer = new SmoothExecutor();
    private readonly handlers = { closed: new Set<() => void>(), error: new Set<(msg: string) => void>() };

    private readonly prjInfo: ProjectInfo;
    private readonly classes: ClassLibrary;
    private readonly stt?: VariableSet | undefined;

    private readonly graphics: GraphicsManager = new GraphicsManager(new SimpleWs());
    private loop: (() => boolean) | undefined;

    readonly options: ProjectOptions;
    readonly dir: VFSDir;

    constructor({ dir, prjInfo, classes, stt, options }: ProjectResources) {
        this.dir = dir;
        this.prjInfo = prjInfo;
        this.classes = classes;
        this.stt = stt;
        this.options = { ...options };
    }

    get state() {
        return this._state;
    }

    get diag() {
        return this._diag;
    }

    get computer() {
        return this._computer;
    }

    set computer(value) {
        if (value === this._computer) return;
        if (this._computer.running) {
            this._computer.stop();
            if (this.loop) value.run(this.loop);
        }
        this._computer = value;
    }

    play(container?: HTMLElement): this;
    play(host: WindowHost): this;
    play(ghost?: HTMLElement | null | WindowHost): this {
        if (this.loop) return this;
        if (ghost) this.graphics.host = ghost instanceof HTMLElement ? new SimpleWs(ghost) : ghost;

        const mem = new MemoryManager(); // Память имиджей.
        unreleasedFunctions.clear();
        const schema = Schema.build(this.prjInfo.rootClassName, this.classes, new Enviroment(mem, { graphics: this.graphics, project: this }));
        if (unreleasedFunctions.size > 0) console.log(`Нереализованные функции:\n${[...unreleasedFunctions.values()].join("\n")}`);
        mem.createBuffers(schema.createTLB()); // Инициализируем память

        schema.applyDefaults(); //Заполняем значениями по умолчанию
        if (this.stt) schema.applyVarSet(this.stt); // Применяем _preload.stt

        this._diag.iterations = 0;
        // Main Loop
        this.shouldClose = false;
        this.loop = () => {
            mem.sync().assertZeroIndexEmpty();
            try {
                schema.compute();
            } catch (e) {
                console.error(e);
                this._state = "error";
                this.handlers.error.forEach((h) => h(e.message));
                return false;
            }
            ++this._diag.iterations;
            if (this.shouldClose === true) {
                this.close();
                this.handlers.closed.forEach((h) => h());
                return false;
            }
            return true;
        };

        this.computer.run(this.loop);
        this._state = "playing";
        return this;
    }

    close(): this {
        this.computer.stop();
        this.loop = undefined;
        this.graphics.closeAllWindows();
        this._state = "closed";
        return this;
    }
    pause(): this {
        if (this.computer.running) {
            this.computer.stop();
            this._state = "paused";
        }
        return this;
    }
    continue(): this {
        if (!this.computer.running && this.loop) {
            this.computer.run(this.loop);
            this._state = "playing";
        }
        return this;
    }
    step(): this {
        if (!this.computer.running && this.loop) {
            this.loop();
        }
        return this;
    }

    on(event: "closed" | "error", handler: any): this {
        this.handlers[event].add(handler);
        return this;
    }
    off(event: "closed" | "error", handler?: any): this {
        if (handler) this.handlers[event].delete(handler);
        else this.handlers[event].clear();
        return this;
    }

    // Методы ProjectManager
    closeAll(): void {
        this.shouldClose = true;
    }
    openSchemeWindow(wname: string, className: string, attribute: string): number {
        const vdr = this.classes.getComposedScheme(className);
        return this.graphics.openWindow(wname, attribute, vdr, this);
    }
    loadSpaceWindow(wname: string, fileName: string, attribute: string): number {
        const file = this.dir.get(fileName);
        const vdr = file && !file.dir ? file.readSyncAs("vdr") : undefined;
        return this.graphics.openWindow(wname, attribute, vdr, this);
    }
    createObjectFromFile2D(hspace: number, fileName: string, x: number, y: number, flags: number): number {
        const file = this.dir.get(fileName);
        const vdr = file && !file.dir && file.readSyncAs("vdr");
        return vdr ? this.graphics.insertVDR(hspace, x, y, flags, vdr) : 0;
    }
    createDIB2d(hspace: number, fileName: string): number {
        const file = this.dir.get(fileName);
        const bmp = file && !file.dir && file.readSyncAs("bmp");
        return bmp ? this.graphics.createBitmap(hspace, bmp) : 0;
    }
    createDoubleDib2D(hspace: number, fileName: string): number {
        const file = this.dir.get(fileName);
        const dbm = file && !file.dir && file.readSyncAs("dbm");
        return dbm ? this.graphics.createDoubleBitmap(hspace, dbm) : 0;
    }
    getClassDirectory(className: string): string {
        const proto = this.classes.get(className);
        return proto !== undefined ? proto.directoryDos : "";
    }
    fileExist(fileName: string): NumBool {
        const file = this.dir.get(fileName);
        return file !== undefined ? 1 : 0;
    }
}
