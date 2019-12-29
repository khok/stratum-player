/*
 * Все функции экспортируется в неймспейс 'StratumPlayer' (см package.json -> yarn build)
 */

import { Project } from "~/core/project";
import { loadProjectData, openZipFromUrl, ReadOptions } from "~/fileReader/fileReaderHelpers";
import { WindowSystem, WindowSystemOptions } from "~/graphics/windowSystem";
import { StratumError } from "./helpers/errors";

// const size = { x: window.innerWidth - 40, y: window.innerHeight - 40 };
// const canvas = document.getElementById("canvas") as HTMLCanvasElement;
// canvas.width = size.x;
// canvas.height = size.y;
// this.areaOriginX = this.areaOriginY = 0;
// this.screenHeight = this.areaWidth = 1920;
// this.screenWidth = this.areaHeight = 1080;

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

export async function fromUrl(
    url: string | string[],
    options?: ReadOptions & { graphicOptions?: WindowSystemOptions }
) {
    const zip = await openZipFromUrl(url);
    const { rootName, collection, varSet } = await loadProjectData(zip, options);
    const ws = new WindowSystem(options && options.graphicOptions);
    return new Player(Project.create(rootName, collection, ws, varSet), ws);
}
