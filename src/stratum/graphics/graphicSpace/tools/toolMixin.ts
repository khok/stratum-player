export abstract class ToolMixin<T extends ToolMixin<T>> {
    handle = 0;
    private subs = new Map<Object, { fn: (obj: T, data?: unknown) => void; data?: unknown }>();
    subscribe(subscriber: Object, fn: (obj: T, data?: unknown) => void, data?: unknown) {
        // fn((this as ToolMixin<T>) as T, data);
        this.subs.set(subscriber, { fn, data });
    }
    unsubscribe(subscriber: Object) {
        this.subs.delete(subscriber);
    }
    get subCount() {
        return this.subs.size;
    }
    protected dispatchChanges() {
        this.subs.forEach(s => s.fn((this as ToolMixin<T>) as T, s.data));
    }
}
