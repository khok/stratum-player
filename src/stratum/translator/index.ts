import { Enviroment } from "./env";
import { Constant } from "./constant";
import { SchemaFunctions } from "./interfaces/schemaFunctions";
export { GraphicsFunctions } from "./interfaces/graphicsFunctions";
export { ProjectFunctions } from "./interfaces/projectFunctions";
export { SchemaMemory } from "./interfaces/schemaMemory";
export { translate } from "./translator";
export { SchemaFunctions };
export { Enviroment };
export { Constant };

export type NumBool = 0 | 1;

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
