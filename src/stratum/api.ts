/*
 * Все функции экспортируется в неймспейс 'StratumPlayer' (см package.json -> yarn build)
 */

import { JSZipObject } from "jszip";
import { Project, ProjectOptions } from "~/core/project";
import { readProjectData, openZipFromFileList, openZipFromUrl, ReadOptions } from "~/fileReader/fileReaderHelpers";
import { WindowSystem, WindowSystemOptions } from "~/graphics/windowSystem";
import { StratumError } from "./helpers/errors";
import { formatMissingCommands, showMissingCommands } from "./helpers/showMissingCommands";
import { VmOperations } from "./vm/operations";
import { ClassData } from "data-types-base";
import { EventDispatcher, EventType } from "./helpers/eventDispatcher";

export class Player {
    private paused: boolean = false;
    private dispatcher = new EventDispatcher();
    constructor(public project: Project, public windows: WindowSystem) {
        windows.dispatcher = this.dispatcher;
    }
    setGraphicOptions(options: WindowSystemOptions) {
        this.windows.set(options);
    }
    get playing() {
        return !this.paused;
    }
    play({ caller, activateByEvent }: { caller?: (fn: () => void) => void; activateByEvent?: boolean } = {}) {
        if (!caller) caller = window.requestAnimationFrame;
        this.paused = false;
        let cont = true;
        if (activateByEvent) {
            this.windows.globalCanvas!.addEventListener("mousemove", () => (cont = true));
            this.windows.globalCanvas!.addEventListener("mousedown", () => (cont = true));
            this.windows.globalCanvas!.addEventListener("mouseup", () => (cont = true));
        }
        let callback: any;
        return new Promise((resolve, reject) => {
            callback = () => {
                if (this.windows.renderAll()) cont = true;
                if (activateByEvent && !cont) {
                    caller!(callback);
                    return;
                }
                cont = false;
                if (!this.project.oneStep()) {
                    this.pause();
                    if (this.project.error) {
                        reject(new StratumError(this.project.error));
                        return;
                    }
                }
                if (!this.paused) caller!(callback);
                else resolve();
            };
            caller!(callback);
        });
    }
    stop() {
        console.warn("Пока не умею возвращать проекты в исходное состояние");
        return;
        this.pause();
        this.project.reset();
    }
    pause() {
        this.paused = true;
    }
    oneStep() {
        this.paused = true;
        this.project.oneStep();
        this.windows.renderAll();
        if (this.project.error) throw new StratumError(this.project.error);
    }
    on(event: EventType, fn: (...data: any) => void) {
        this.dispatcher.on(event, fn);
    }
}

export type PlayerOptions = ReadOptions & {
    graphicOptions?: WindowSystemOptions;
    projectOptions?: ProjectOptions;
    preloadedLibs?: JSZipObject[];
    continueOnErrorCallback?: (msg: string) => boolean;
};

function handlePossibleErrors(collection: Map<string, ClassData>, callback: (msg: string) => boolean) {
    const { errors, missingOperations } = showMissingCommands(collection, VmOperations);
    if (errors.length === 0 && missingOperations.length === 0) return true;

    if (errors.length > 0) console.log(errors.concat(";\n"));
    if (missingOperations.length > 0) console.log(formatMissingCommands(missingOperations));
    return callback("Возникли ошибки (см в консоли (F12))\nВсе равно запустить?");
}

export async function fromZip(zip: JSZipObject[], options?: PlayerOptions) {
    const { rootName, collection, varSet, images } = await readProjectData(zip, options);
    if (!handlePossibleErrors(collection, (options && options.continueOnErrorCallback) || confirm)) return undefined;
    const windowSystem = new WindowSystem(options && options.graphicOptions);
    return new Player(
        Project.create(
            { rootName, classes: collection, windowSystem, varSet, images },
            options && options.projectOptions
        ),
        windowSystem
    );
}

export async function fromUrl(url: string | string[], options?: PlayerOptions) {
    const zip = await openZipFromUrl(url);
    const addLibs = options && options.preloadedLibs;
    return await fromZip(addLibs ? zip.concat(...addLibs) : zip, options);
}

export async function fromFileList(files: FileList, options?: PlayerOptions) {
    const zip = await openZipFromFileList(files);
    const addLibs = options && options.preloadedLibs;
    return await fromZip(addLibs ? zip.concat(...addLibs) : zip, options);
}

export { openZipFromUrl as loadLibraryFromUrl, openZipFromFileList as loadLibraryFromFileList };
