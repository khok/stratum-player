import { Hyperbase } from "stratum/fileFormats/vdr";
import { Constant } from "./constant";

export type NumBool = 0 | 1;
export interface Clearable<T> {
    clear(id: T): void;
    clearAll(): void;
}

export interface EventSubscriber {
    receive(code: Constant, ...args: (string | number)[]): Promise<void>;
}

export interface HyperCallReceiver {
    hyperCall(hyper: Hyperbase): void;
}
