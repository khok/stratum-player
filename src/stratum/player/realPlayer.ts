import { ExecutorAsyncCallback, Player, PlayerOptions, SmoothExecutor, WindowHost } from "stratum/api";
import { Enviroment } from "stratum/env";
import { ProjectResources } from "stratum/project";
import { SimpleWs } from "./ws";

export class RealPlayer implements Player {
    private _state: Player["state"] = "closed";
    private readonly _diag = { iterations: 0, missingCommands: [] };
    private _computer = new SmoothExecutor();
    private readonly handlers = { closed: new Set<() => void>(), error: new Set<(msg: string) => void>() };

    private loop: ExecutorAsyncCallback | null;

    private host: WindowHost;

    private projectRes: ProjectResources;

    private env: Enviroment | null;

    readonly options: PlayerOptions;

    constructor(res: ProjectResources) {
        this.projectRes = res;
        this.host = new SimpleWs();
        this.env = null;
        this.options = {};
        this.loop = null;
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
            if (this.loop) value.runAsync(this.loop);
        }
        this._computer = value;
    }

    play(container?: HTMLElement): this;
    play(host: WindowHost): this;
    play(newHost?: HTMLElement | null | WindowHost): this {
        if (this.loop) return this;
        if (newHost) {
            this.host = newHost instanceof HTMLElement ? new SimpleWs(newHost) : newHost;
        }

        const env = (this.env = new Enviroment(this.projectRes, this.host, this.options));
        this._diag.iterations = 0;
        // Main Loop
        this.loop = async () => {
            let res = false;
            try {
                res = await env.compute();
            } catch (e) {
                env.stopForever();
                this._state = "error";
                console.error(e);
                this.handlers.error.forEach((h) => h(e.message));
                return false;
            }
            ++this._diag.iterations;
            if (res === false) {
                this.loop = null;
                this.env = null;
                this._state = "closed";
                this.handlers.closed.forEach((h) => h());
            }
            return res;
        };

        this.computer.runAsync(this.loop);
        this._state = "playing";
        return this;
    }

    close(): this {
        if (this.env?.isWaiting()) return this;
        this.computer.stop();
        this.env?.closeAllRes();
        this.loop = null;
        this.env = null;
        this._state = "closed";
        return this;
    }
    pause(): this {
        if (this.env?.isWaiting()) return this;
        if (this.computer.running) {
            this.computer.stop();
            this._state = "paused";
        }
        return this;
    }
    continue(): this {
        if (this.env?.isWaiting()) return this;
        if (!this.computer.running && this.loop) {
            this.computer.runAsync(this.loop);
            this._state = "playing";
        }
        return this;
    }
    step(): this {
        if (this.env?.isWaiting()) return this;
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
