import { NumBool } from "stratum/common/types";
import { VarType } from "stratum/common/varType";
import { MutableArrayLike } from "stratum/helpers/utilityTypes";

/**
 * Массивы памяти схемы, в которые производится запись значений.
 */
export interface SchemaMemory {
    readonly oldFloats: MutableArrayLike<number>;
    readonly newFloats: MutableArrayLike<number>;

    readonly oldInts: MutableArrayLike<number>;
    readonly newInts: MutableArrayLike<number>;

    readonly oldStrings: MutableArrayLike<string>;
    readonly newStrings: MutableArrayLike<string>;
}

/**
 * Функции, выполняемые в контексте окружения.
 */
export interface EnviromentContextFunctions {
    getTime(
        arr1: MutableArrayLike<number>,
        hour: number,
        arr2: MutableArrayLike<number>,
        min: number,
        arr3: MutableArrayLike<number>,
        sec: number,
        arr4: MutableArrayLike<number>,
        hund: number
    ): void;
    getDate(arr1: MutableArrayLike<number>, year: number, arr2: MutableArrayLike<number>, mon: number, arr3: MutableArrayLike<number>, day: number): void;
    getActualSize2d(hspace: number, hobject: number, xArr: MutableArrayLike<number>, xId: number, yArr: MutableArrayLike<number>, yId: number): NumBool;
    getVarInfo(
        classname: string,
        varIdx: number,

        varNameArr: MutableArrayLike<string>,
        varNameId: number,

        varTypeArr: MutableArrayLike<string>,
        varTypeId: number,

        varDefValueArr: MutableArrayLike<string>,
        varDefValueId: number,

        varDescrArr: MutableArrayLike<string>,
        varDescrId: number,

        varFlagsArr: MutableArrayLike<number>,
        varFlagsId: number
    ): NumBool;
}

/**
 * Функции, выполняемые в контексте проекта.
 */
export interface ProjectContextFunctions {
    readonly env: EnviromentContextFunctions;
}

/**
 * Функции, выполняемые в контексте элемента схемы.
 */
export interface SchemaContextFunctions {
    readonly prj: ProjectContextFunctions;
    stubCall(name: string, args: (string | number)[]): never;
}

/**
 * Возможные типы значений, которое могут возвращать функции Stratum.
 */
export type PossibleValue = string | number | void;
/**
 * Генератор, создаваемый при запуске выполнения модели.
 */
export type ComputeResult = Generator<Promise<PossibleValue>, PossibleValue>;
export type WaitingTarget = ComputeResult | PossibleValue | Promise<PossibleValue>;

/**
 * Информация о переменной имиджа.
 */
export interface VarInfo {
    readonly name: string;
    readonly type: VarType;
    // isParameter: boolean;
    readonly isReturnValue: boolean;
}

/**
 * Модель имиджа.
 */
export interface ClassModel {
    /**
     * Имидж является функцией?
     */
    readonly isFunction: boolean;
    /**
     * Информация о переменных имиджа.
     */
    readonly vars: ReadonlyArray<VarInfo>;
    /**
     * Выполняет модель имиджа.
     * @param tlb Массив отображения локальных адресов переменных на глобальные.
     * @param mem Память схемы.
     * @param schema Вычисляемая схема.
     */
    compute(tlb: ArrayLike<number>, mem: SchemaMemory, schema: SchemaContextFunctions): ComputeResult;
}

/**
 * Библиотека моделей.
 */
export interface ModelLibrary {
    /**
     * Возвращает модель имиджа `classname`.
     */
    getModel(className: string): ClassModel | null;
}

export interface InternalClassModel extends ClassModel {
    call(schema: SchemaContextFunctions, fname: string, ...args: (string | number)[]): ComputeResult;
    waitFor(target: WaitingTarget): void;
    getWaitResult(): WaitingTarget;
    saveContext(ctx: PossibleValue[]): void;
    loadContext(): PossibleValue[];
}
