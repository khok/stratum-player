/*
 * Все функции экспортируется в неймспейс 'StratumPlayer' (см package.json -> yarn build)
 */

import { Project, ProjectDebugOptions } from "~/core/project";
import { loadProjectData, openZipFromUrl, ReadOptions } from "~/fileReader/fileReaderHelpers";
import { WindowSystem, WindowSystemOptions } from "~/graphics/windowSystem";
import { StratumError } from "./helpers/errors";
import { ClassData, VarSetData } from "data-types-base";

export class Player {
    constructor(public project: Project, public windows: WindowSystem) {}
    private paused: boolean = false;
    private reseted: boolean = true;
    get playState() {
        return this.reseted ? "stopped" : this.paused ? "paused" : "playing";
    }
    setGraphicOptions(options: WindowSystemOptions) {
        this.windows.set(options);
    }
    play() {
        this.reseted = false;
        this.paused = false;
        const promise = new Promise((res, rej) => {
            const req = () => {
                window.requestAnimationFrame(() => {
                    const running = this.project.oneStep() && !this.paused;
                    this.windows.renderAll();
                    if (running) {
                        req();
                    } else {
                        if (this.project.error) rej(new StratumError(this.project.error));
                        else res();
                    }
                });
            };
            req();
        });
        return promise;
    }
    stop() {
        this.pause();
        this.reseted = true;
        this.project.reset();
    }
    pause() {
        this.paused = true;
    }
    oneStep() {
        this.reseted = false;
        this.paused = true;
        this.project.oneStep();
        this.windows.renderAll();
        if (this.project.error) throw new StratumError(this.project.error);
    }
}
export type PlayerOptions = ReadOptions & { projectOptions?: ProjectDebugOptions } & {
    graphicOptions?: WindowSystemOptions;
};

function createPlayer(
    rootName: string,
    collection: Map<string, ClassData>,
    varSet?: VarSetData,
    options?: PlayerOptions
) {
    const ws = new WindowSystem(options && options.graphicOptions);
    return new Player(Project.create(rootName, collection, ws, varSet, options && options.projectOptions), ws);
}

export async function fromUrl(url: string | string[], options?: PlayerOptions) {
    const zip = await openZipFromUrl(url);
    const { rootName, collection, varSet } = await loadProjectData(zip, options);
    return createPlayer(rootName, collection, varSet, options);
}
