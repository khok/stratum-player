import { ExecutorCallback, FastestExecutor, SmoothExecutor } from "stratum/common/computers";
import { Enviroment } from "stratum/enviroment";
import { EnviromentHandlers, ProjectResources } from "stratum/enviroment/enviroment";
import { AddDirInfo, PathInfo, Player, PlayerOptions, WindowHost } from "stratum/stratum";
import { SimpleWs } from "./ws";

export class RealPlayer implements Player {
    /**
     * Загружает все ресурсы и создает новый экземпляр плеера.
     * @param prjFile - путь к файлу проекта.
     * @param dirInfo - дополнительная информация (пути к системным библиотекам).
     */
    static async create(prjFile: PathInfo, dirInfo?: AddDirInfo[]): Promise<Player> {
        const res = await Enviroment.loadProject(prjFile, dirInfo);
        return new RealPlayer(res);
    }

    private _state: Player["state"] = "closed";
    private readonly _diag = { iterations: 0, missingCommands: [] };
    private computer: SmoothExecutor | FastestExecutor = new SmoothExecutor();
    private readonly handlers: EnviromentHandlers = { closed: new Set(), error: new Set(), shell: new Set(), cursorRequest: null };

    private loop: ExecutorCallback | null;

    private host: WindowHost;

    private envArgs: ProjectResources;

    private env: Enviroment | null;

    readonly options: PlayerOptions;

    private constructor(res: ProjectResources) {
        this.envArgs = res;
        this.host = new SimpleWs();
        this.env = null;
        this.options = {};
        this.loop = null;
    }

    speed(speed: "smooth" | "fast", cycles?: number): this {
        const comp = speed === "smooth" ? new SmoothExecutor() : new FastestExecutor(cycles);
        const curComp = this.computer;
        if (curComp.running) {
            curComp.stop();
            if (this.loop) comp.run(this.loop);
        }
        this.computer = comp;
        return this;
    }

    get state() {
        return this._state;
    }

    get diag() {
        return this._diag;
    }

    play(container?: HTMLElement): this;
    play(host: WindowHost): this;
    play(newHost?: HTMLElement | WindowHost): this {
        if (this.loop) return this;
        if (newHost) {
            this.host = newHost instanceof HTMLElement ? new SimpleWs(newHost) : newHost;
        }

        const env = (this.env = new Enviroment(this.envArgs, this.host, this.handlers));
        this._diag.iterations = 0;
        // Main Loop
        let _continue = true;
        // let _exc = false;
        this.loop = () => {
            if (!_continue) {
                return false;
            }
            // Циклы вхолостую.
            if (env.isWaiting()) {
                return true;
            }
            // _exc = true;
            env.compute()
                .then((stop) => {
                    // _exc = false;
                    ++this._diag.iterations;
                    if (stop) {
                        this.loop = null;
                        this.env = null;
                        this._state = "closed";
                        this.handlers.closed.forEach((h) => h());
                    }
                    _continue = !stop;
                })
                .catch((e) => {
                    // _exc = false;
                    _continue = false;
                    this._state = "error";
                    console.error(e);
                    this.handlers.error.forEach((h) => h(e.message));
                });
            return true;
        };

        this.computer.run(this.loop);
        this._state = "playing";
        return this;
    }

    close(): this {
        if (this._state === "error") {
            this.env?.closeAllRes().then(() => {
                this.loop = null;
                this._state = "closed";
            });
            this.env = null;
            return this;
        } else {
            this.env?.requestStop();
            return this.step();
        }
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

    on(event: "closed" | "error" | "shell" | "cursorRequest", handler: any): this {
        if (event === "cursorRequest") {
            this.handlers.cursorRequest = handler;
            return this;
        }
        this.handlers[event].add(handler);
        return this;
    }
    off(event: "closed" | "error" | "shell" | "cursorRequest", handler?: any): this {
        if (event === "cursorRequest") {
            this.handlers.cursorRequest = null;
            return this;
        }
        if (handler) this.handlers[event].delete(handler);
        else this.handlers[event].clear();
        return this;
    }
}
