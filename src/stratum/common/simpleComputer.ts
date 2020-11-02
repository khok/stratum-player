import { Executor } from "stratum/api";

export class SimpleComputer implements Executor {
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
