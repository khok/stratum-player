export class SuperMap<K, V> {
    private m: Map<K, Set<V>> = new Map();
    set(key: K, value: V): this {
        const ex = this.m.get(key);
        if (ex) {
            ex.add(value);
            return this;
        }
        this.m.set(key, new Set([value]));
        return this;
    }

    get(key: K): Set<V> | null {
        return this.m.get(key) ?? null;
    }

    delete(key: K): boolean {
        return this.m.delete(key);
    }

    [Symbol.iterator]() {
        return this.m[Symbol.iterator]();
    }
}
