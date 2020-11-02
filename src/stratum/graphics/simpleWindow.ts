import { VectorDrawing } from "stratum/fileFormats/vdr";
import { WindowWithSpace } from "stratum/vm/interfaces/windowWithSpace";
import { NumBool } from "stratum/vm/types";
import { HTMLWindowWrapper } from "./html";

export class SimpleWindow implements WindowWithSpace {
    readonly classname: string = "";
    readonly filename: string = "";

    originX = 0;
    originY = 0;

    constructor(private wnd: HTMLWindowWrapper, source?: VectorDrawing["source"]) {
        if (source) {
            const { name, origin } = source;
            if (origin === "class") this.classname = name;
            else if (origin === "file") this.filename = name;
        }
    }

    // На самом деле мы не можем позволить ВМ стратума управлять положением окон, так что
    // здесь просто заглушки.
    setOrigin(x: number, y: number): NumBool {
        this.originX = x;
        this.originY = y;
        return 1;
    }

    setSize(width: number, height: number): NumBool {
        return this.wnd.fixedSize(width, height) ? 1 : 0;
    }

    get width(): number {
        return this.wnd.width;
    }
    get height(): number {
        return this.wnd.height;
    }
}
