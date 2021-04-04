import { Executor, ExecutorAsyncCallback, ExecutorCallback } from "stratum/api";

export class SmoothComputer implements Executor {
    private frameId = 0;

    get running() {
        return this.frameId !== 0;
    }

    run(cb: ExecutorCallback) {
        if (this.running) return;
        const res = () => (this.frameId = cb() ? requestAnimationFrame(res) : 0);
        this.frameId = requestAnimationFrame(res);
    }

    runAsync(cb: ExecutorAsyncCallback): void {
        if (this.running) return;
        const res = () => cb().then((cont) => (this.frameId = cont ? requestAnimationFrame(res) : 0));
        this.frameId = requestAnimationFrame(res);
    }

    stop(): void {
        if (!this.running) return;
        cancelAnimationFrame(this.frameId);
        this.frameId = 0;
    }
}

export class FastestComputer implements Executor {
    private frameId = 0;
    private timeout: number;
    constructor(args: any) {
        this.timeout = typeof args === "number" ? args : 0;
    }

    get running() {
        return this.frameId !== 0;
    }

    run(cb: ExecutorCallback) {
        if (this.running) return;
        const res = () => (this.frameId = cb() && cb() && cb() && cb() ? setTimeout(res, this.timeout) : 0);
        this.frameId = setTimeout(res, this.timeout);
    }

    runAsync(cb: ExecutorAsyncCallback): void {
        if (this.running) return;
        // const res = () => cb().then((cont) => (this.frameId = cont ? setTimeout(res, this.timeout) : 0));
        // this.frameId = setTimeout(res, this.timeout);
        const res = async () => {
            this.frameId = (await cb()) && (await cb()) && (await cb()) && (await cb()) ? setTimeout(res, this.timeout) : 0;
        };
        this.frameId = setTimeout(res, this.timeout);
    }

    stop(): void {
        if (!this.running) return;
        clearTimeout(this.frameId);
        this.frameId = 0;
    }
}
