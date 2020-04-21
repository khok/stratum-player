/*
 * Все функции экспортируется в неймспейс 'StratumPlayer' (см package.json -> yarn build)
 */

import { ClassData } from "data-types-base";
import { JSZipObject } from "jszip";
import { openZipFromFileList, openZipFromUrl, ReadOptions, readProjectData } from "~/fileReader/fileReaderHelpers";
import { StratumError } from "./helpers/errors";
import { formatMissingCommands, showMissingCommands } from "./helpers/showMissingCommands";
import { Player, PlayerData, PlayerOptions } from "./player";
import { VmOperations } from "./vm/operations";

export class ExtendedPlayer extends Player {
    private paused: boolean = false;
    constructor(data: PlayerData, options?: PlayerOptions) {
        super(data, options);
    }

    get playing() {
        return !this.paused;
    }

    play(caller: (fn: () => void) => void = window.requestAnimationFrame) {
        this.paused = false;
        return new Promise((resolve, reject) => {
            const callback = () => {
                this.render();
                if (this.paused) {
                    if (this.error) {
                        reject(new StratumError(this.error));
                    } else {
                        resolve();
                    }
                    return;
                }
                this.paused = !this.step();
                caller!(callback);
            };
            caller(callback);
        });
    }

    pause() {
        this.paused = true;
    }

    oneStep() {
        this.paused = true;
        this.step();
        this.render();
        if (this.error) throw new StratumError(this.error);
    }
}

export interface ExtendedPlayerOptions extends PlayerOptions, ReadOptions {
    preloadedLibs?: JSZipObject[];
    continueOnErrorCallback?: (msg: string) => boolean;
}

function handlePossibleErrors(collection: Map<string, ClassData>, callback: (msg: string) => boolean) {
    const { errors, missingOperations } = showMissingCommands(collection, VmOperations);
    if (errors.length === 0 && missingOperations.length === 0) return true;

    if (errors.length > 0) console.log(errors.concat(";\n"));
    if (missingOperations.length > 0) console.log(formatMissingCommands(missingOperations));
    return callback("Возникли ошибки (см в консоли (F12))\nВсе равно запустить?");
}

export async function fromZip(zip: JSZipObject[], options?: ExtendedPlayerOptions) {
    const data = await readProjectData(zip, options);
    if (!handlePossibleErrors(data.classesData, (options && options.continueOnErrorCallback) || confirm))
        return undefined;
    return new ExtendedPlayer(data, options);
}

export async function fromUrl(url: string | string[], options?: ExtendedPlayerOptions) {
    const zip = await openZipFromUrl(url);
    const addLibs = options && options.preloadedLibs;
    return await fromZip(addLibs ? zip.concat(...addLibs) : zip, options);
}

export async function fromFileList(files: FileList, options?: ExtendedPlayerOptions) {
    const zip = await openZipFromFileList(files);
    const addLibs = options && options.preloadedLibs;
    return await fromZip(addLibs ? zip.concat(...addLibs) : zip, options);
}

export { openZipFromUrl as loadLibraryFromUrl, openZipFromFileList as loadLibraryFromFileList };

// play({ caller, activateByEvent }: { caller?: (fn: () => void) => void; activateByEvent?: boolean } = {}) {
//     if (!caller) caller = window.requestAnimationFrame;
//     this.paused = false;
//     let cont = true;
//     if (activateByEvent) {
//         this.windows.globalCanvas!.addEventListener("mousemove", () => (cont = true));
//         this.windows.globalCanvas!.addEventListener("mousedown", () => (cont = true));
//         this.windows.globalCanvas!.addEventListener("mouseup", () => (cont = true));
//     }
//     let callback: any;
//     return new Promise((resolve, reject) => {
//         callback = () => {
//             if (this.player.render()) cont = true;
//             if (activateByEvent && !cont) {
//                 caller!(callback);
//                 return;
//             }
//             cont = false;
//             if (!this.player.step()) {
//                 this.pause();
//                 if (this.player.error) {
//                     reject(new StratumError(this.player.error));
//                     return;
//                 }
//             }
//             if (!this.paused) caller!(callback);
//             else resolve();
//         };
//         caller!(callback);
//     });
// }
