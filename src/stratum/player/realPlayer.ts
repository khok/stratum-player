import { ExecutorCallback, FastestComputer, SmoothComputer } from "stratum/common/computers";
import { Enviroment } from "stratum/enviroment";
import { ProjectResources } from "stratum/enviroment/enviroment";
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
    private computer: SmoothComputer | FastestComputer = new SmoothComputer();
    private readonly handlers = { closed: new Set<() => void>(), error: new Set<(msg: string) => void>() };

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
        const comp = speed === "smooth" ? new SmoothComputer() : new FastestComputer(cycles);
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
    play(newHost?: HTMLElement | null | WindowHost): this {
        if (this.loop) return this;
        if (newHost) {
            this.host = newHost instanceof HTMLElement ? new SimpleWs(newHost) : newHost;
        }

        const env = (this.env = new Enviroment(this.envArgs, this.host));
        this._diag.iterations = 0;
        // Main Loop
        let _continue = true;
        // let _exc = false;
        this.loop = () => {
            if (env.isWaiting()) {
                return true;
            }
            if (!_continue) {
                return false;
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
        this.env?.requestStop();
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
