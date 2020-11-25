import { ProjectFunctions, GraphicsFunctions, EventDispatcher, SchemaMemory } from ".";

type Farr = SchemaMemory["newFloats"];
export class Enviroment {
    private _level = 0;
    readonly project?: ProjectFunctions;
    readonly graphics?: GraphicsFunctions & EventDispatcher;
    constructor(public memory: SchemaMemory, { project, graphics }: Pick<Enviroment, "project" | "graphics"> = {}) {
        this.project = project;
        this.graphics = graphics;
    }

    get level() {
        return this._level;
    }
    inc() {
        ++this._level;
    }
    dec() {
        --this._level;
    }

    getTime(arr1: Farr, hour: number, arr2: Farr, min: number, arr3: Farr, sec: number, arr4: Farr, hund: number) {
        const time = new Date();
        arr1[hour] = time.getHours();
        arr2[min] = time.getMinutes();
        arr3[sec] = time.getSeconds();
        arr4[hund] = time.getMilliseconds() * 0.1;
    }
}
