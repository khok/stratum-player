import { VarType } from "stratum/fileFormats/cls";
import { EventDispatcher, GraphicsFunctions, ProjectFunctions } from ".";

export interface MemorySize {
    floatsCount: number;
    intsCount: number;
    stringsCount: number;
}

// FIXME: можно подставить Float32Array, если нужен небольшой перформанс.
type Farr = Float64Array;
export class Enviroment {
    private _level = 0;
    readonly project?: ProjectFunctions;
    readonly graphics?: GraphicsFunctions & EventDispatcher;

    oldFloats: Farr = new Float64Array(0);
    newFloats: Farr = new Float64Array(0);

    oldInts = new Int32Array(0);
    newInts = new Int32Array(0);

    oldStrings = new Array<string>();
    newStrings = new Array<string>();

    olds: { [index: number]: Farr | Int32Array | string[] } = [];
    news: { [index: number]: Farr | Int32Array | string[] } = [];

    constructor({ project, graphics }: Pick<Enviroment, "project" | "graphics"> = {}) {
        this.project = project;
        this.graphics = graphics;
    }

    init({ floatsCount, intsCount, stringsCount }: MemorySize) {
        this.oldFloats = new Float64Array(floatsCount);
        this.newFloats = new Float64Array(floatsCount);

        this.oldInts = new Int32Array(intsCount);
        this.newInts = new Int32Array(intsCount);

        this.oldStrings = new Array<string>(stringsCount).fill("");
        this.newStrings = new Array<string>(stringsCount).fill("");

        this.olds[VarType.Float] = this.oldFloats;
        this.olds[VarType.Handle] = this.oldInts;
        this.olds[VarType.ColorRef] = this.oldInts;
        this.olds[VarType.String] = this.oldStrings;

        this.news[VarType.Float] = this.newFloats;
        this.news[VarType.Handle] = this.newInts;
        this.news[VarType.ColorRef] = this.newInts;
        this.news[VarType.String] = this.newStrings;
        return this;
    }

    sync() {
        this.oldFloats.set(this.newFloats);
        this.oldInts.set(this.newInts);
        for (let i = 0; i < this.newStrings.length; i++) this.oldStrings[i] = this.newStrings[i];
        return this;
    }

    /**
     * Проверка, не было ли изменено (в результате багов) зарезервированное значение.
     */
    assertZeroIndexEmpty() {
        if (
            this.oldFloats[0] !== 0 ||
            this.newFloats[0] !== 0 ||
            this.oldInts[0] !== 0 ||
            this.newInts[0] !== 0 ||
            this.oldStrings[0] !== "" ||
            this.newStrings[0] !== ""
        )
            throw Error("Было изменено зарезервированное значение переменной");
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

    getDate(arr1: Farr, year: number, arr2: Farr, mon: number, arr3: Farr, day: number) {
        const time = new Date();
        arr1[year] = time.getFullYear();
        arr2[mon] = time.getMonth();
        arr3[day] = time.getDate();
    }
    getTickCount() {
        return new Date().getTime() - start;
    }
    newArray() {
        throw Error("Функция New не реализована");
    }
    MCISendString() {
        return 263;
    }
}
const start = new Date().getTime();
