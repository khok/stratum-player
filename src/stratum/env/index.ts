import { Constant } from "stratum/env/constant";

export type NumBool = 0 | 1;
export interface MemorySize {
    floatsCount: number;
    intsCount: number;
    stringsCount: number;
}

export interface EventSubscriber {
    receive(code: Constant, ...args: (string | number)[]): void;
}

export interface EventDispatcher {
    subscribe(sub: EventSubscriber, wnameOrHspace: string | number, obj2d: number, code: Constant): void;
    unsubscribe(sub: EventSubscriber, wnameOrHspace: string | number, code: Constant): void;
    setCapture(hspace: number, sub: EventSubscriber): void;
    releaseCapture(): void;
}

export { Constant } from "./constant";
export { Enviroment } from "./enviroment";
export { Env } from "./interfaces";
