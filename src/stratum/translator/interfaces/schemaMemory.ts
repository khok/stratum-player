export interface SchemaMemory {
    oldFloats: Float64Array; //<- заменить на 32, мб быстрее будет бегать. в контексте тоже.
    newFloats: Float64Array;

    oldInts: Int32Array;
    newInts: Int32Array;

    oldStrings: string[];
    newStrings: string[];

    olds: { [index: number]: Float64Array | Int32Array | string[] };
    news: { [index: number]: Float64Array | Int32Array | string[] };
}
