import { NumBool } from "stratum/common/types";
import { VDRSource } from "stratum/fileFormats/vdr";
import { Scene } from "./scene";

export class Wnd {
    sceneHandle: number | Promise<number>;
    projectID: import("c:/Users/anon/Desktop/stratum-player/src/stratum/project/project").Project;
    name(): string {
        throw new Error("Method not implemented.");
    }
    source(): VDRSource {
        throw new Error("Method not implemented.");
    }
    scene(): Scene {
        throw new Error("Method not implemented.");
    }

    originX(): number {
        throw new Error("Method not implemented.");
    }
    originY(): number {
        throw new Error("Method not implemented.");
    }
    setOrigin(orgX: number, orgY: number): NumBool {
        throw new Error("Method not implemented.");
    }

    width(): number {
        throw new Error("Method not implemented.");
    }
    height(): number {
        throw new Error("Method not implemented.");
    }
    setSize(width: number, height: number): NumBool {
        throw new Error("Method not implemented.");
    }

    clientWidth(): number {
        throw new Error("Method not implemented.");
    }
    clientHeight(): number {
        throw new Error("Method not implemented.");
    }
    setClientSize(width: number, height: number): NumBool {
        throw new Error("Method not implemented.");
    }

    title(): string {
        throw new Error("Method not implemented.");
    }
    setTitle(title: string): NumBool {
        throw new Error("Method not implemented.");
    }

    toTop(): NumBool {
        throw new Error("Method not implemented.");
    }

    setAttrib(flag: number): NumBool {
        throw new Error("Method not implemented.");
    }

    setTransparent(level: number): NumBool {
        throw new Error("Method not implemented.");
    }
    setTransparentColor(cref: number): NumBool {
        throw new Error("Method not implemented.");
    }

    close(): NumBool {
        throw new Error("Method not implemented.");
    }
}
