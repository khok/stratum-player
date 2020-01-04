/*
 * Все функции экспортируется в неймспейс 'StratumPlayer' (см package.json -> yarn build)
 */

import { JSZipObject } from "jszip";
import { Project, ProjectDebugOptions } from "~/core/project";
import { loadProjectData, openZipFromFileList, openZipFromUrl, ReadOptions } from "~/fileReader/fileReaderHelpers";
import { WindowSystem, WindowSystemOptions } from "~/graphics/windowSystem";
import { StratumError } from "./helpers/errors";
import { formatMissingCommands, showMissingCommands } from "./helpers/showMissingCommands";
import { VmOperations } from "./vm/operations";
import { ClassData } from "data-types-base";

export class Player {
    constructor(public project: Project, public windows: WindowSystem) {}
    private paused: boolean = false;
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
            const start = () => {
                if (cont) return;
                cont = true;
                caller!(callback);
            };
            this.windows.globalCanvas!.addEventListener("mousemove", start);
            this.windows.globalCanvas!.addEventListener("mousedown", start);
            this.windows.globalCanvas!.addEventListener("mouseup", start);
        }
        let callback: any;
        return new Promise((resolve, reject) => {
            callback = () => {
                if (activateByEvent && !cont) return;
                cont = false;
                const stepResult = this.project.oneStep();
                this.windows.renderAll();
                if (!stepResult) {
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
}

export type PlayerOptions = ReadOptions & { projectOptions?: ProjectDebugOptions } & {
    graphicOptions?: WindowSystemOptions;
} & { preloadedLibs?: JSZipObject[] };

function handlePossibleErrors(collection: Map<string, ClassData>) {
    const { errors, missingOperations } = showMissingCommands(collection, VmOperations);
    if (errors.length === 0 && missingOperations.length === 0) return true;

    if (errors.length > 0) console.log(errors.concat(";\n"));
    if (missingOperations.length > 0) console.log(formatMissingCommands(missingOperations));
    alert("Возникли ошибки (см в консоли (F12))");
    return window.confirm("В работе проекта могут возникнуть ошибки.\nВсе равно запустить?");
}

export async function fromZip(zip: JSZipObject[], options?: PlayerOptions) {
    const { rootName, collection, varSet } = await loadProjectData(zip, options);
    if (!handlePossibleErrors(collection)) return undefined;
    const ws = new WindowSystem(options && options.graphicOptions);
    return new Player(Project.create(rootName, collection, ws, varSet, options && options.projectOptions), ws);
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
