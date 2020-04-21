declare module "vm-interfaces-core" {
    import { VmStateContainer } from "vm-types";
    import { GraphicSpaceState } from "vm-interfaces-gspace";
    import { VarData } from "cls-types";

    export type VmBool = 0 | 1;
    export type GraphicSpaceResolver = (options?: any) => GraphicSpaceState;

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
        createSchemeInstance(className: string): GraphicSpaceResolver | undefined;
        hasClass(className: string): VmBool;
        getClassDir(className: string): string;
        getClassesByProtoName(className: string): IterableIterator<ClassState>;
    }

    export interface InputSystemController {
        keyPressed(keyIndex: number): VmBool;
    }
}
