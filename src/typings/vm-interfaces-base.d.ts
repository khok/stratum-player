declare module "vm-interfaces-base" {
    import { VmStateContainer } from "vm-types";
    import { GraphicSpaceState } from "vm-interfaces-gspace";
    import { VarData } from "data-types-base";

    export type VmBool = 0 | 1;
    export type GraphicSpaceResolver = (options?: any) => GraphicSpaceState;

    export interface MemoryState {
        oldDoubleValues: Float64Array;
        newDoubleValues: Float64Array;

        oldLongValues: Int32Array;
        newLongValues: Int32Array;

        oldStringValues: string[];
        newStringValues: string[];
        // //FLOATS
        // setDefaultDoubleValue(id: number, value: number): void;
        // getDefaultDoubleValue(id: number): number;

        // setNewDoubleValue(id: number, value: number): void;
        // getNewDoubleValue(id: number): number;

        // setOldDoubleValue(id: number, value: number): void;
        // getOldDoubleValue(id: number): number;

        // //LONGS
        // setDefaultLongValue(id: number, value: number): void;
        // getDefaultLongValue(id: number): number;

        // setNewLongValue(id: number, value: number): void;
        // getNewLongValue(id: number): number;

        // setOldLongValue(id: number, value: number): void;
        // getOldLongValue(id: number): number;

        // //STRINGS
        // setDefaultStringValue(id: number, value: string): void;
        // getDefaultStringValue(id: number): string;

        // setNewStringValue(id: number, value: string): void;
        // getNewStringValue(id: number): string;

        // setOldStringValue(id: number, value: string): void;
        // getOldStringValue(id: number): string;
    }

    export interface ClassState {
        readonly protoName: string;
        readonly canReceiveEvents: boolean;

        readonly varIdToLowcaseNameMap?: Map<string, number>;
        readonly varTypes?: VarData["type"][];
        readonly doubleVarMappingArray?: Uint16Array;
        readonly longVarMappingArray?: Uint16Array;
        readonly stringVarMappingArray?: Uint16Array;

        // getVarIdLowCase(varName: string): number | undefined;

        // //FLOATS
        // setDefaultDoubleValue(id: number, value: number): void;
        // getDefaultDoubleValue(id: number): number;

        // setNewDoubleValue(id: number, value: number): void;
        // getNewDoubleValue(id: number): number;

        // setOldDoubleValue(id: number, value: number): void;
        // getOldDoubleValue(id: number): number;

        // //LONGS
        // setDefaultLongValue(id: number, value: number): void;
        // getDefaultLongValue(id: number): number;

        // setNewLongValue(id: number, value: number): void;
        // getNewLongValue(id: number): number;

        // setOldLongValue(id: number, value: number): void;
        // getOldLongValue(id: number): number;

        // //STRINGS
        // setDefaultStringValue(id: number, value: string): void;
        // getDefaultStringValue(id: number): string;

        // setNewStringValue(id: number, value: string): void;
        // getNewStringValue(id: number): string;

        // setOldStringValue(id: number, value: string): void;
        // getOldStringValue(id: number): string;

        // setVarValueByLowCaseName(name: string, value: string | number): void;

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
