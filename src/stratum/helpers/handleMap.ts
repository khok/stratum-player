/**
 * В основном используется в графике для получения объекта по его дескриптору,
 * а также для добавления с первым свободным дескриптором.
 */
export class HandleMap<T> extends Map<number, T> {
    static create<T>(entries?: ReadonlyArray<readonly [number, T]> | null) {
        return new Map<number, T>(entries);
    }
    static getFreeHandle(map: Map<number, any>, greaterThan?: number) {
        let handle = greaterThan || 0;
        while (map.has(++handle));
        return handle;
    }
}
