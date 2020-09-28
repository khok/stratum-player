import { VectorDrawing } from "/common/fileFormats/vdr/types/vectorDrawing";
import { WindowWithSpace } from "/vm/interfaces/windowWithSpace";
import { NumBool } from "/vm/types";
import { RendererWindow } from "./interfaces";

export interface SimpleWindowArgs {
    window: RendererWindow;
    source?: VectorDrawing["source"];
}

export class SimpleWindow implements WindowWithSpace {
    private window: RendererWindow;

    readonly classname: string = "";
    readonly filename: string = "";

    constructor({ source, window }: SimpleWindowArgs) {
        if (source) {
            const { name, origin } = source;
            if (origin === "class") this.classname = name;
            else if (origin === "file") this.filename = name;
        }
        this.window = window;
    }

    get name(): string {
        return this.window.name;
    }

    get renderer() {
        return this.window.renderer;
    }

    get originX(): number {
        return this.window.originX;
    }
    get originY(): number {
        return this.window.originY;
    }

    setOrigin(x: number, y: number): NumBool {
        this.window.setOrigin(x, y);
        return 1;
    }

    get width(): number {
        return this.window.width;
    }
    get height(): number {
        return this.window.height;
    }

    setSize(width: number, height: number): NumBool {
        this.window.setSize(width, height);
        return 1;
    }

    close(): void {
        this.window.close();
    }
}
