import { Project, ProjectOptions, SmoothExecutor, WindowHost } from "stratum/api";
import { ClassLibrary } from "stratum/common/classLibrary";
import { ProjectInfo } from "stratum/fileFormats/prj";
import { VariableSet } from "stratum/fileFormats/stt";
import { GraphicsManager } from "stratum/graphics";
import { Schema } from "stratum/schema";
import { Enviroment, ProjectFunctions } from "stratum/translator";
import { VFSDir } from "stratum/vfs";
import { MemoryManager } from "./memoryManager";
import { NativeWs, SimpleWs } from "./ws";

export interface ProjectResources {
    dir: VFSDir;
    prjInfo: ProjectInfo;
    classes: ClassLibrary;
    stt?: VariableSet;
    options?: ProjectOptions;
}

export class Player implements Project, ProjectFunctions {
    private _state: Project["state"] = "closed";
    private readonly _diag = { iterations: 0, missingCommands: [] };
    private _computer = new SmoothExecutor();
    private readonly handlers = { closed: new Set<() => void>(), error: new Set<(msg: string) => void>() };

    private readonly prjInfo: ProjectInfo;
    private readonly classes: ClassLibrary;
    private readonly stt?: VariableSet | undefined;

    private graphics?: GraphicsManager;
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

    play(): this;
    play(container: HTMLElement): this;
    play(host: WindowHost): this;
    play(project: Player): this;
    play(ghost?: HTMLElement | WindowHost | Player): this {
        if (this.loop) return this;

        let graphics = ghost instanceof Player ? ghost.graphics : this.graphics;
        if (!graphics) {
            let host: WindowHost;
            if (!ghost || ghost instanceof Player) host = new NativeWs();
            else host = ghost instanceof HTMLElement ? new SimpleWs(ghost) : ghost;
            graphics = new GraphicsManager(host);

            this.graphics = graphics;
            if (ghost instanceof Player) ghost.graphics = graphics;
        } else if (ghost && !(ghost instanceof Player)) {
            graphics.host = ghost instanceof HTMLElement ? new SimpleWs(ghost) : ghost;
        }

        const mem = new MemoryManager(); // Память имиджей.
        const schema = Schema.build(this.prjInfo.rootClassName, this.classes, new Enviroment(mem, { graphics, project: this }));
        mem.createBuffers(schema.createTLB()); // Инициализируем память

        schema.applyDefaults(); //Заполняем значениями по умолчанию
        if (this.stt) schema.applyVarSet(this.stt); // Применяем _preload.stt

        this._diag.iterations = 0;
        // Main Loop
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
            return true;
        };

        this.computer.run(this.loop);
        this._state = "playing";
        return this;
    }

    close(): this {
        this.computer.stop();
        this.loop = undefined;
        this.graphics?.closeAllWindows();
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
        this.close();
        this.handlers.closed.forEach((h) => h());
    }
    openSchemeWindow(wname: string, className: string, attribute: string): number {
        const vdr = this.classes.getComposedScheme(className);
        return this.graphics!.openWindow(wname, attribute, vdr, this);
    }
    loadSpaceWindow(wname: string, fileName: string, attribute: string): number {
        const file = this.dir.get(fileName);
        const vdr = file && !file.dir ? file.readSyncAs("vdr") : undefined;
        return this.graphics!.openWindow(wname, attribute, vdr, this);
    }
    createObjectFromFile2D(hspace: number, fileName: string, x: number, y: number, flags: number): number {
        const file = this.dir.get(fileName);
        const vdr = file && !file.dir && file.readSyncAs("vdr");
        return vdr ? this.graphics!.insertVDR(hspace, x, y, flags, vdr) : 0;
    }
    createDIB2d(hspace: number, fileName: string): number {
        const file = this.dir.get(fileName);
        const st = file && !file.dir && file.streamSync();
        return st ? this.graphics!.createBitmap(hspace, st) : 0;
    }
    createDoubleDib2D(hspace: number, fileName: string): number {
        const file = this.dir.get(fileName);
        const st = file && !file.dir && file.streamSync();
        return st ? this.graphics!.createDoubleBitmap(hspace, st) : 0;
    }
    getClassDirectory(className: string): string {
        const proto = this.classes.get(className);
        return proto !== undefined ? proto.directoryDos : "";
    }
}
