import { WindowSystemOptions } from "stratum/api";
import { SingleCanvasWindowSystem } from "./single/singleCanvasWindowSystem";

export function createWS(opts?: WindowSystemOptions) {
    return new SingleCanvasWindowSystem(opts);
}
