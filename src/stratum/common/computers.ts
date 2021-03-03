import { Executor } from "stratum/api";

export class SmoothComputer implements Executor {
    private frameId = 0;
    private _running = false;

    private _loop(cb: () => boolean): number {
        return requestAnimationFrame(() => {
            if (cb()) this.frameId = this._loop(cb);
            else this._running = false;
        });
    }
    private _unloop() {
        cancelAnimationFrame(this.frameId);
    }

    get running() {
        return this._running;
    }

    run(callback: () => boolean): void {
        if (this._running) return;
        this._running = true;
        this.frameId = this._loop(callback);
    }

    stop(): void {
        if (!this._running) return;
        this._running = false;
        this._unloop();
    }
}

export class FastestComputer implements Executor {
    private frameId = 0;
    private _running = false;
    private timeout: number;

    constructor(args: any) {
        this.timeout = typeof args === "number" ? args : 0;
    }

    private _loop(cb: () => boolean): number {
        return setTimeout(() => {
            if (cb() && cb() && cb() && cb()) this.frameId = this._loop(cb);
            else this._running = false;
        }, this.timeout);
    }
    private _unloop() {
        clearTimeout(this.frameId);
    }

    get running() {
        return this._running;
    }

    run(callback: () => boolean): void {
        if (this._running) return;
        this._running = true;
        this.frameId = this._loop(callback);
    }

    stop(): void {
        if (!this._running) return;
        this._running = false;
        this._unloop();
    }
}
