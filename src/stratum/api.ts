/*
 * Все функции экспортируется в неймспейс 'StratumPlayer' (см package.json -> yarn build)
 */

import { ClassData } from "cls-types";
import { JSZipObject } from "jszip";
import {
    openZipFromFileList,
    openZipFromUrl,
    ProjectContent,
    ReadOptions,
    readProjectData,
} from "~/fileReader/fileReaderHelpers";
import { formatMissingCommands, showMissingCommands } from "~/helpers/showMissingCommands";
import { Player, PlayerOptions } from "~/player";
import { VmOperations } from "~/vm/operations";

export class ExtendedPlayer extends Player {
    private reqFrameHandle?: number;
    constructor(data: ProjectContent, options?: PlayerOptions) {
        super(data, options);
    }

    get playing() {
        return this.reqFrameHandle !== undefined;
    }

    play() {
        if (this.playing) return;
        const callback = () => {
            const res = this.step();
            this.render();
            if (res) this.reqFrameHandle = requestAnimationFrame(callback);
        };
        this.reqFrameHandle = requestAnimationFrame(callback);
        return this;
    }

    oneStep() {
        this.stopPlay();
        this.step();
        this.render();
        return this;
    }

    stopPlay() {
        if (this.reqFrameHandle !== undefined) cancelAnimationFrame(this.reqFrameHandle);
        this.reqFrameHandle = undefined;
        return this;
    }
}

export interface ExtendedPlayerOptions extends PlayerOptions, ReadOptions {
    preloadedLibs?: JSZipObject[];
    checkErrors?: (msg: string) => boolean;
    zipEncoding?: string;
}

function handlePossibleErrors(collection: Map<string, ClassData>) {
    const { errors, missingOperations } = showMissingCommands(collection, VmOperations);
    if (errors.length === 0 && missingOperations.length === 0) return "";

    let res = "";
    if (errors.length > 0) res += errors.concat(";\n");
    if (missingOperations.length > 0) res += formatMissingCommands(missingOperations);
    return res;
}

export async function fromZip(zip: JSZipObject[], options?: ExtendedPlayerOptions) {
    const data = await readProjectData(zip, options);
    if (options && options.checkErrors) {
        const res = handlePossibleErrors(data.classesData);
        if (res && !options.checkErrors(res)) return undefined;
    }
    return new ExtendedPlayer(data, options);
}

export async function fromUrl(url: string | string[], options?: ExtendedPlayerOptions) {
    const zip = await openZipFromUrl(url, options && options.zipEncoding);
    const addLibs = options && options.preloadedLibs;
    return await fromZip(addLibs ? zip.concat(...addLibs) : zip, options);
}

export async function fromFileList(files: FileList, options?: ExtendedPlayerOptions) {
    const zip = await openZipFromFileList(files, options && options.zipEncoding);
    const addLibs = options && options.preloadedLibs;
    return await fromZip(addLibs ? zip.concat(...addLibs) : zip, options);
}

export { openZipFromUrl as loadLibraryFromUrl, openZipFromFileList as loadLibraryFromFileList };
