import { Enviroment } from "./env";
import { EventCode } from "./eventCode";
import { SchemaFunctions } from "./interfaces/schemaFunctions";
export { GraphicsFunctions } from "./interfaces/graphicsFunctions";
export { ProjectFunctions } from "./interfaces/projectFunctions";
export { SchemaMemory } from "./interfaces/schemaMemory";
export { translate } from "./translator";
export { SchemaFunctions };
export { Enviroment };
export { EventCode };

export type NumBool = 0 | 1;

export interface ClassModel {
    (schema: SchemaFunctions, env: Enviroment): void;
}

export interface EventSubscriber {
    readonly captureEventsFromSpace: number;
    receive(code: EventCode, ...args: (string | number)[]): void;
}

export interface EventDispatcher {
    subscribe(sub: EventSubscriber, wnameOrHspace: string | number, obj2d: number, code: EventCode): void;
    unsubscribe(sub: EventSubscriber, wnameOrHspace: string | number, code: EventCode): void;
}
