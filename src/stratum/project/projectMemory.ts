export interface ProjectMemory {
    readonly oldFloats: ArrayLike<number>;
    readonly newFloats: ArrayLike<number>;

    readonly oldInts: ArrayLike<number>;
    readonly newInts: ArrayLike<number>;

    readonly oldStrings: string[];
    readonly newStrings: string[];
}
