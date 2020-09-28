import { UsageError } from "stratum/common/errors";
import { VectorDrawing } from "stratum/common/fileFormats/vdr/types/vectorDrawing";
import { HandleMap } from "stratum/helpers/handleMap";
import { GraphicSpace } from "stratum/vm/interfaces/graphicSpace";
import { WindowsManager } from "stratum/vm/interfaces/windowsManager";
import { NumBool } from "stratum/vm/types";
import { SimpleWindow } from "./simpleWindow";
import { WindowSystem } from "./interfaces";
import { Scene } from "../scene";

export interface GraphicsManagerOptions {}

export class GraphicsManager implements WindowsManager {
    private ws: WindowSystem;

    private scenes = HandleMap.create<Scene>();
    private scenesByWinName = new Map<string, Scene>();
    private windows = new Map<string, SimpleWindow>();

    constructor(windowSystem: WindowSystem, options?: GraphicsManagerOptions) {
        this.ws = windowSystem;
        this.set(options || {});
    }

    get screenWidth(): number {
        return this.ws.screenWidth;
    }
    get screenHeight(): number {
        return this.ws.screenHeight;
    }
    get areaOriginX(): number {
        return this.ws.areaOriginX;
    }
    get areaOriginY(): number {
        return this.ws.areaOriginY;
    }
    get areaWidth(): number {
        return this.ws.areaWidth;
    }
    get areaHeight(): number {
        return this.ws.areaHeight;
    }

    set(options: GraphicsManagerOptions) {
        Object.assign(this, options);
        return this;
    }

    openSchemeWindow(windowName: string, attrib: string, vdr?: VectorDrawing): number {
        if (attrib !== "") console.warn(`Следующие атрибуты окна "${windowName}" не поддерживаются:\n"${attrib}"`);
        if (this.hasWindow(windowName)) throw new UsageError(`Окно ${windowName} уже существует`);

        const wsWindow = this.ws.createWindow(windowName);

        const window = new SimpleWindow({ source: vdr && vdr.source, window: wsWindow });
        this.windows.set(windowName, window);

        const handle = HandleMap.getFreeHandle(this.scenes);
        const scene = new Scene({ handle, vdr, window });

        this.scenes.set(handle, scene);
        this.scenesByWinName.set(windowName, scene);

        return handle;
    }

    hasWindow(windowName: string): NumBool {
        return this.windows.get(windowName) ? 1 : 0;
    }

    getWindow(windowName: string) {
        return this.windows.get(windowName);
    }

    closeWindow(windowName: string): NumBool {
        const window = this.windows.get(windowName);
        if (!window) return 0;
        // window.space.renderer.clear();
        // this.scenes.delete(window.space.handle);
        this.windows.delete(windowName);
        return 1;
    }

    getSpace(spaceHandle: number) {
        return this.scenes.get(spaceHandle);
    }

    getSpaceByWinName(windowName: string): GraphicSpace | undefined {
        return this.scenesByWinName.get(windowName);
    }

    closeAllWindows() {
        this.windows.forEach((w) => w.close());
        this.windows = new Map();
        this.scenesByWinName = new Map();
        this.scenes = new Map();
    }
}
