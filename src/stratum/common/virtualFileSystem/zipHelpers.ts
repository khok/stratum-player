import { loadAsync } from "jszip";

/**
 * Получает содержимое архива из файла или Blob.
 * @param encoding Кодировка архива (по умолчанию - cp866).
 */
export async function loadFromFile(file: Blob | File, encoding: string = "cp866") {
    const decoder = new TextDecoder(encoding);
    return loadAsync(file, { decodeFileName: (bytes) => decoder.decode(bytes) });
}

/**
 * Получает содержимое архива с `url`.
 * @param encoding Кодировка архива (по умолчанию - cp866).
 */
export async function loadFromUrl(url: string, encoding?: string) {
    try {
        const resp = await fetch(url);
        const file = await resp.blob();
        const zip = await loadFromFile(file, encoding);
        return zip;
    } catch (e) {
        throw new Error(`Невозможно открыть архив ${url}:\n${e}`);
    }
}
