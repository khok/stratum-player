declare module "vm-interfaces-base" {
    import { VmStateContainer } from "vm-types";
    import { GraphicSpaceState } from "vm-interfaces-graphics";

    export type VmBool = 0 | 1;
    export type GraphicSpaceResolver = (options?: any) => GraphicSpaceState;

    export interface ClassState {
        readonly protoName: string;
        getVarIdLowCase(varName: string): number | undefined;

        setNewVarValue(id: number, value: string | number): void;
        setOldVarValue(id: number, value: string | number): void;
        getNewVarValue(id: number): string | number;
        getOldVarValue(id: number): string | number;

        setVarValueByLowCaseName(name: string, value: string | number): void;

        getClassByPath(path: string): ClassState | undefined;
        /**
         * Вычисляет схему имиджа и все схемы дочерних имиджей.
         * @param ctx Контекст выполнения.
         * @param respectDisableVar Учитывать значение переменных *_enable* и *_disable*,
         * т.е. не вычислять схему, если имидж заблокирован.
         */
        computeSchemeRecursive(ctx: VmStateContainer, respectDisableVar: boolean): boolean;
    }

    export interface ProjectController {
        createSchemeInstance(className: string): GraphicSpaceResolver | undefined;
        hasClass(className: string): VmBool;
        getClassesByProtoName(className: string): IterableIterator<ClassState>;
        stop(): void;
    }

    export interface InputSystemController {
        keyPressed(keyIndex: number): VmBool;
    }
}
