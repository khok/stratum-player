export abstract class ToolMixin<T extends ToolMixin<T>> {
    handle: number;
    private subs = new Map<Object, { fn: (data?: unknown) => void; data?: unknown }>();

    constructor(data: { handle: number }) {
        this.handle = data.handle;
    }

    subscribe(subscriber: Object, fn: (data?: unknown) => void, data?: unknown) {
        this.subs.set(subscriber, { fn, data });
    }

    unsubscribe(subscriber: Object) {
        this.subs.delete(subscriber);
    }

    get subCount() {
        return this.subs.size;
    }

    protected dispatchChanges() {
        this.subs.forEach((s) => s.fn(s.data));
    }
}
