import { options } from "./options";
import { RealPlayer } from "./player";
window.stratum = window.stratum ?? {};
window.stratum.player = RealPlayer.create;
window.stratum.options = options;
window.stratum.version = "0.10.2";

// /**
//  * Создает новый проект из файла.
//  * @param dirInfo - настройки директорий проекта, дополнительные пути поиска имиджей.
//  */
// // export function player(prjFile: PathInfo, dirInfo?: AddDirInfo[]): Promise<Player> {
// //     return RealPlayer.create(prjFile, dirInfo);
// // }
// // export const fs: FileSystemConstructor;

// // export const unzip: ZipFSConstructor = createZipFS;

// // export interface Logger {
// //     info(msg: string): void;
// //     warn(msg: string): void;
// //     err(msg: string): void;
// // }

// // export function setLogLevel(logLevel: "err" | "full") {
// //     // console.log = logLevel === "err" ? function () {} : origL;
// // }

// // export interface ExecutorConstructor {
// //     new (args?: any): Executor;
// // }

// // export const SmoothExecutor: ExecutorConstructor = SmoothComputer;
// // export const FastestExecutor: ExecutorConstructor = FastestComputer;

// /**
//  * Версия API.
//  */
// // export const version: string = "0.10.0";
