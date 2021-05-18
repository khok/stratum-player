import { Hyperbase } from "stratum/fileFormats/vdr";
import { Point2D } from "stratum/helpers/types";
import { Constant } from "./constant";

export type NumBool = 0 | 1;
export interface Clearable<T> {
    clear(id: T): void;
    clearAll(): void;
}

export interface EventSubscriber {
    receive(code: Constant, ...args: (string | number)[]): Promise<void>;
}

export interface HyperCallHandler {
    click(hyper: Hyperbase | null, point: Point2D): void;
}
