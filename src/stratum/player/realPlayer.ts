import { Player, PlayerOptions, SmoothExecutor, WindowHost } from "stratum/api";
import { Enviroment } from "stratum/env";
import { ProjectResources } from "stratum/project";
import { SimpleWs } from "./ws";

export class RealPlayer implements Player {
    private _state: Player["state"] = "closed";
    private readonly _diag = { iterations: 0, missingCommands: [] };
    private _computer = new SmoothExecutor();
    private readonly handlers = { closed: new Set<() => void>(), error: new Set<(msg: string) => void>() };

    private loop: (() => boolean) | undefined;

    private host: WindowHost;

    private projectRes: ProjectResources;

    private env: Enviroment | null;

    readonly options: PlayerOptions;

    constructor(res: ProjectResources) {
        this.projectRes = res;
        this.host = new SimpleWs();
        this.env = null;
        this.options = {};
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
    play(newHost?: HTMLElement | null | WindowHost): this {
        if (this.loop) return this;
        if (newHost) {
            this.host = newHost instanceof HTMLElement ? new SimpleWs(newHost) : newHost;
        }

        const env = (this.env = new Enviroment(this.projectRes, this.host, this.options));
        this._diag.iterations = 0;
        // Main Loop
        this.loop = () => {
            let res = false;
            try {
                res = env.compute();
            } catch (e) {
                console.error(e);
                this._state = "error";
                this.handlers.error.forEach((h) => h(e.message));
                return false;
            }
            ++this._diag.iterations;
            if (res === false) {
                this.close();
                this.handlers.closed.forEach((h) => h());
            }
            return res;
        };

        this.computer.run(this.loop);
        this._state = "playing";
        return this;
    }

    close(): this {
        this.computer.stop();
        this.loop = undefined;
        if (this.env) {
            this.env.closeAllRes();
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
