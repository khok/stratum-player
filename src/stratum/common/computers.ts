export interface ExecutorCallback {
    (): boolean;
}

// export interface ExecutorAsyncCallback {
//     (): Promise<boolean>;
// }

/**
 * Планировщик цикличного выполнения функции.
 */
export interface Executor {
    /**
     * Цикл выполнения запущен?
     */
    readonly running: boolean;
    /**
     * Планирует цикличный вызов функции.
     * @param callback Функция, которая должна вызываться циклично.
     * Если она возвращает false, цикл выполнения прерывается.
     */
    run(callback: ExecutorCallback): void;
    // runAsync(callback: ExecutorAsyncCallback): void;
    /**
     * Прерывает цикл выполнения.
     */
    stop(): void;
}

export class SmoothExecutor implements Executor {
    private frameId = 0;

    get running() {
        return this.frameId !== 0;
    }

    run(callback: ExecutorCallback) {
        if (this.running) return;
        const loop: FrameRequestCallback = () => {
            this.frameId = callback() ? requestAnimationFrame(loop) : 0;
        };
        this.frameId = requestAnimationFrame(loop);
    }

    // runAsync(cb: ExecutorAsyncCallback): void {
    //     if (this.running) return;
    //     const res = () => cb().then((cont) => (this.frameId = cont ? requestAnimationFrame(res) : 0));
    //     this.frameId = requestAnimationFrame(res);
    // }

    stop(): void {
        if (!this.running) return;
        cancelAnimationFrame(this.frameId);
        this.frameId = 0;
    }
}

export class FastestExecutor implements Executor {
    private frameId = 0;
    // private timeout: number;
    constructor(private cycles: number = 1) {
        // this.timeout = typeof args === "number" ? args : 0;
        // this.timeout = 0;
    }

    get running() {
        return this.frameId !== 0;
    }

    run(callback: ExecutorCallback) {
        if (this.running) return;
        const res: TimerHandler = () => {
            for (let i = 0; i < this.cycles; ++i) {
                if (!callback()) {
                    this.frameId = 0;
                    return;
                }
            }
            this.frameId = setTimeout(res, 0 /*this.timeout*/);
        };
        this.frameId = setTimeout(res /*this.timeout*/);
    }

    // runAsync(cb: ExecutorAsyncCallback): void {
    //     if (this.running) return;
    //     // const res = () => cb().then((cont) => (this.frameId = cont ? setTimeout(res, this.timeout) : 0));
    //     // this.frameId = setTimeout(res, this.timeout);
    //     const res = async () => {
    //         this.frameId = (await cb()) && (await cb()) && (await cb()) && (await cb()) ? setTimeout(res, this.timeout) : 0;
    //     };
    //     this.frameId = setTimeout(res, this.timeout);
    // }

    stop(): void {
        if (!this.running) return;
        clearTimeout(this.frameId);
        this.frameId = 0;
    }
}
