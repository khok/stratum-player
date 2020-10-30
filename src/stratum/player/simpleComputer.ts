import { Executor } from "stratum/api";

export class SimpleComputer implements Executor {
    private frameId = 0;
    private _running = false;

    private _loop(cb: () => void) {
        this.frameId = requestAnimationFrame(() => {
            this._loop(cb);
            cb();
        });
    }
    private _unloop() {
        cancelAnimationFrame(this.frameId);
    }

    get running() {
        return this._running;
    }

    run(callback: () => void): void {
        if (this._running) return;
        this._loop(callback);
        this._running = true;
    }

    stop(): void {
        if (!this._running) return;
        this._unloop();
        this._running = false;
    }
}
