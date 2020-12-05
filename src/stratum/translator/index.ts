import { Constant } from "./constant";
import { Enviroment, MemorySize } from "./env";
import { SchemaFunctions } from "./interfaces/schemaFunctions";
import { VarType } from "./varType";
export { GraphicsFunctions } from "./interfaces/graphicsFunctions";
export { ProjectFunctions } from "./interfaces/projectFunctions";
export { translate } from "./translator";
export { SchemaFunctions };
export { Enviroment, MemorySize };
export { Constant };
export { VarType };

export type NumBool = 0 | 1;

export interface ClassVars {
    count: number;
    nameUCToId: Map<string, number>;
    types: VarType[];
    defaultValues: (string | number | undefined)[];
}

export interface ClassModel {
    (schema: SchemaFunctions, env: Enviroment): void;
}

export interface EventSubscriber {
    readonly captureEventsFromSpace: number;
    receive(code: Constant, ...args: (string | number)[]): void;
}

export interface EventDispatcher {
    subscribe(sub: EventSubscriber, wnameOrHspace: string | number, obj2d: number, code: Constant): void;
    unsubscribe(sub: EventSubscriber, wnameOrHspace: string | number, code: Constant): void;
}
