import { Project, ProjectOptions, SmoothExecutor, WindowHost } from "stratum/api";
import { ClassLibrary } from "stratum/common/classLibrary";
import { Enviroment } from "stratum/env";
import { ProjectInfo } from "stratum/fileFormats/prj";
import { VariableSet } from "stratum/fileFormats/stt";
import { Schema } from "stratum/schema";
import { unreleasedFunctions } from "stratum/translator/translator";
import { VFSDir } from "stratum/vfs";
import { SimpleWs } from "./ws";

export interface ProjectResources {
    dir: VFSDir;
    prjInfo: ProjectInfo;
    classes: ClassLibrary;
    stt?: VariableSet;
    options?: ProjectOptions;
}

export class Player implements Project {
    private _state: Project["state"] = "closed";
    private readonly _diag = { iterations: 0, missingCommands: [] };
    private _computer = new SmoothExecutor();
    private readonly handlers = { closed: new Set<() => void>(), error: new Set<(msg: string) => void>() };

    private readonly prjInfo: ProjectInfo;
    private readonly classes: ClassLibrary;
    private readonly stt?: VariableSet | undefined;

    private host = new SimpleWs();
    private loop: (() => boolean) | undefined;

    readonly options: ProjectOptions;
    readonly dir: VFSDir;
    env: Enviroment | null = null;

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
        if (ghost) this.host = ghost instanceof HTMLElement ? new SimpleWs(ghost) : ghost;

        unreleasedFunctions.clear();
        const env = (this.env = new Enviroment(this.classes, this.dir, this.host));
        const schema = Schema.build(this.prjInfo.rootClassName, this.classes, env);
        if (unreleasedFunctions.size > 0) console.log(`Нереализованные функции:\n${[...unreleasedFunctions.values()].join("\n")}`);
        env.init(schema.createTLB()); // Инициализируем память

        schema.applyDefaults(); //Заполняем значениями по умолчанию
        if (this.stt) schema.applyVarSet(this.stt); // Применяем _preload.stt

        this._diag.iterations = 0;
        // Main Loop
        env.shouldClose = false;
        this.loop = () => {
            env.sync().assertZeroIndexEmpty();
            try {
                schema.compute();
            } catch (e) {
                console.error(e);
                this._state = "error";
                this.handlers.error.forEach((h) => h(e.message));
                return false;
            }
            ++this._diag.iterations;
            if (env.shouldClose === true) {
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
        if (this.env) {
            this.env.closeAllWindows();
            this.env = null;
        }
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
}
