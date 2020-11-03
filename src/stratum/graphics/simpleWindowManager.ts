import { VectorDrawing } from "stratum/fileFormats/vdr";
import { HandleMap } from "stratum/helpers/handleMap";
import { GraphicSpace } from "stratum/vm/interfaces/graphicSpace";
import { WindowsManager } from "stratum/vm/interfaces/windowsManager";
import { NumBool } from "stratum/vm/types";
import { WindowWrapper } from "./html";
import { Scene } from "./scene";
import { SimpleWindow } from "./simpleWindow";

export class SimpleWindowManager implements WindowsManager {
    private scenes = HandleMap.create<Scene>();
    private scenesByWinName = new Map<string, Scene>();
    private windowsHandleMap = HandleMap.create<string>();
    private windows = new Map<string, SimpleWindow>();

    areaOriginX: number = 0;
    areaOriginY: number = 0;
    screenWidth: number;
    screenHeight: number;
    areaWidth: number;
    areaHeight: number;

    constructor(private wnd?: WindowWrapper) {
        this.screenWidth = this.areaWidth = wnd ? wnd.width : 1920;
        this.screenHeight = this.areaHeight = wnd ? wnd.height : 1080;
    }

    private attribWarned = false;
    private noWndShowed = false;
    private secondWndWarned = false;
    private windowWasOpen = false;
    openSchemeWindow(windowName: string, attrib: string, vdr?: VectorDrawing): number {
        const { wnd } = this;
        if (!wnd) {
            if (!this.noWndShowed) console.warn(`Проект попытался открыть окно "${windowName}" с атрибутами "${attrib}"`);
            this.noWndShowed = true;
            return 0;
        }

        if (this.windowWasOpen) {
            if (!this.secondWndWarned) console.warn(`Проект попытался открыть второе окно "${windowName}" с атрибутами "${attrib}"`);
            this.secondWndWarned = true;
            return 0;
        }

        if (attrib !== "" && !this.attribWarned) {
            console.warn(`Следующие атрибуты окна "${windowName}" не поддерживаются:\n"${attrib}"`);
            this.attribWarned = true;
        }

        if (this.hasWindow(windowName)) throw Error(`Окно "${windowName}" уже существует`);

        document.title = windowName;
        // ширину нужно передавать в зависимости от attrib
        const window = new SimpleWindow(wnd, vdr && vdr.source);
        this.windows.set(windowName, window);

        const handle = HandleMap.getFreeHandle(this.scenes);
        const scene = new Scene({ handle, vdr, renderer: wnd.renderer });

        this.scenes.set(handle, scene);
        this.scenesByWinName.set(windowName, scene);
        this.windowsHandleMap.set(handle, windowName);

        this.windowWasOpen = true;
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
        this.windows.delete(windowName);
        this.windowWasOpen = false;
        return 1;
    }

    getSpace(spaceHandle: number) {
        return this.scenes.get(spaceHandle);
    }

    getWinNameBySpaceHandle(spaceHandle: number): string {
        return this.windowsHandleMap.get(spaceHandle) || "";
    }

    getSpaceByWinName(windowName: string): GraphicSpace | undefined {
        return this.scenesByWinName.get(windowName);
    }
}
