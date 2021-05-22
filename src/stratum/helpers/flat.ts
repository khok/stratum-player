export function flat<T>(arr: T[][]): T[] {
    return new Array<T>().concat(...arr);
}
