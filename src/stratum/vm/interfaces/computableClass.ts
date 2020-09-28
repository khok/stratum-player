import { VarCode } from "/common/varCode";
import { ExecutionContext } from "../executionContext";

/**
 * Значения и описание переменных имиджа.
 */
export interface ComputableClassVars {
    readonly nameToIdMap: Map<string, number>;
    readonly names: string[];
    readonly typeCodes: VarCode[];
    readonly globalIds: Uint16Array;
}

/**
 * Вычисляемый имидж, имеющий состояние (переменные).
 */
export interface ComputableClass {
    readonly canReceiveEvents: boolean;
    readonly vars?: ComputableClassVars;

    readonly protoName: string;
    getClassByPath(path: string): ComputableClass | undefined;

    startCaptureEvents(spaceHandle: number): void;
    stopCaptureEvents(): void;
    isCapturingEvents(spaceHandle: number): boolean;

    /**
     * Выполняет код имиджа.
     * @param ctx Контекст выполнения.
     * @param force Выполнить вычисления, даже если имидж отключен
     * (отключение осуществляется через переменные `_disable`/`_enable`).
     */
    compute(ctx: ExecutionContext, force: boolean): void;
}
