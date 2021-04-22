/**
 * Различные операции по нормализации файловых путей.
 */
export function getDirectory(path: string): string {
    return path.substring(0, path.lastIndexOf("\\") + 1);
}
