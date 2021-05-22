import { goldenws } from "./goldenws";

window.stratum = window.stratum ?? {};
window.stratum.goldenws = goldenws;

// export type ZipSource = File | Blob | ArrayBuffer | Uint8Array;

// export interface OpenZipOptions {
//     /**
//      * Каталог, в которую монтируется содержимое архива.
//      * Может начинаться с префикса диска, например, `C:/Projects`
//      * Если префикс не указан, то он автоматически устанавливается как `C:`
//      * @default "C:"
//      */
//     directory?: string;
//     /**
//      * Кодировка файловых путей.
//      * @default "cp866"
//      */
//     encoding?: string;
// }

// // export interface ZipFSConstructor {
// //     (source: ZipSource, options?: OpenZipOptions): Promise<ZipFS>;
// // }

// /**
//  * Создает новую файловую систему из указанных источников ZIP-архивов.
//  * @param source Источник ZIP-архива.
//  * @param options Опции распаковки ZIP-архива.
//  */
// export function unzip(source: ZipSource, options?: OpenZipOptions): Promise<FileSystem> {
//     return ZipFS.create(source, options);
// }
