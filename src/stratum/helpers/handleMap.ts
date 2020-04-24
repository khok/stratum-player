export class HandleMap<T> extends Map<number, T> {
    static create<T>(entries?: ReadonlyArray<readonly [number, T]> | null) {
        return new Map<number, T>(entries);
    }
    static getFreeHandle(map: Map<number, any>, greaterThan?: number) {
        let handle = greaterThan || 0;
        while (map.get(++handle));
        return handle;
    }
}
