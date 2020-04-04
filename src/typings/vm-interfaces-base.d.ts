declare module "vm-interfaces-base" {
    import { VmStateContainer } from "vm-types";
    import { GraphicSpaceState } from "vm-interfaces-graphics";

    export type VmBool = 0 | 1;
    export type GraphicSpaceResolver = (options?: any) => GraphicSpaceState;

    export interface ClassState {
        readonly protoName: string;
        readonly canReceiveEvents: boolean;
        getVarIdLowCase(varName: string): number | undefined;

        setNewVarValue(id: number, value: string | number): void;
        setOldVarValue(id: number, value: string | number): void;
        getNewVarValue(id: number): string | number;
        getOldVarValue(id: number): string | number;

        setVarValueByLowCaseName(name: string, value: string | number): void;

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
        getClassesByProtoName(className: string): IterableIterator<ClassState>;
    }

    export interface InputSystemController {
        keyPressed(keyIndex: number): VmBool;
    }
}
