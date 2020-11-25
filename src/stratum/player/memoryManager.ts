import { VarType } from "stratum/fileFormats/cls";
import { MemoryManagerArgs } from "stratum/schema";
import { SchemaMemory } from "stratum/translator";

export class MemoryManager implements SchemaMemory {
    oldFloats = new Float64Array(0);
    newFloats = new Float64Array(0);

    oldInts = new Int32Array(0);
    newInts = new Int32Array(0);

    oldStrings = new Array<string>();
    newStrings = new Array<string>();

    olds: { [index: number]: Float64Array | Int32Array | string[] } = [];
    news: { [index: number]: Float64Array | Int32Array | string[] } = [];

    createBuffers({ floatsCount, longsCount, stringsCount }: MemoryManagerArgs) {
        this.oldFloats = new Float64Array(floatsCount);
        this.newFloats = new Float64Array(floatsCount);

        this.oldInts = new Int32Array(longsCount);
        this.newInts = new Int32Array(longsCount);

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

    /**
     * Копирует новые значения переменных в старые.
     */
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
}
