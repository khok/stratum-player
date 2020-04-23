declare module "vm-interfaces-core" {
    import { VarData } from "cls-types";
    import { VectorDrawData } from "vdr-types";
    import { VmStateContainer } from "vm-types";

    export type VmBool = 0 | 1;

    export interface MemoryState {
        oldDoubleValues: Float64Array;
        newDoubleValues: Float64Array;

        oldLongValues: Int32Array;
        newLongValues: Int32Array;

        oldStringValues: string[];
        newStringValues: string[];
    }

    export interface ClassState {
        readonly protoName: string;
        readonly canReceiveEvents: boolean;

        readonly varnameToIdMap?: Map<string, number>;
        readonly varTypes?: VarData["type"][];
        readonly doubleIdToGlobal?: Uint16Array;
        readonly longIdToGlobal?: Uint16Array;
        readonly stringIdToGlobal?: Uint16Array;

        getClassByPath(path: string): ClassState | undefined;

        startCaptureEvents(spaceHandle: number): void;
        stopCaptureEvents(): void;

        isCapturingEvents(spaceHandle: number): boolean;
        /**
         * Вычисляет схему имиджа и все схемы дочерних имиджей.
         * @param ctx Контекст выполнения.
         * @param force Вычислять схему даже если имидж отключен.
         */
        computeSchemeRecursive(ctx: VmStateContainer, force: boolean): void;
    }

    export interface ProjectController {
        getClassScheme(className: string): VectorDrawData | undefined;
        loadSchemeFromFile(fileName: string): VectorDrawData | undefined;
        hasClass(className: string): VmBool;
        getClassDir(className: string): string;
        getClassesByProtoName(className: string): IterableIterator<ClassState>;
    }

    export interface InputSystemController {
        keyPressed(keyIndex: number): VmBool;
    }
}
