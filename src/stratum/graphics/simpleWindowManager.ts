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
    private windowsBySpaceHandle = HandleMap.create<string>();
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

        const attribs = attrib.split("|").map((c) => c.trim().toUpperCase());
        let notsup = [];
        for (const attr of attribs) {
            if (attr === "") continue;
            switch (attr) {
                case "WS_BYSPACE":
                    // wnd.disableResize = true;
                    break;
                case "WS_DIALOG":
                    // wnd.disableResize = false;
                    break;
                case "WS_NOCAPTION":
                    break;
                default:
                    notsup.push(attr);
            }
        }
        if (notsup.length > 0) {
            console.warn(`Следующие атрибуты окна "${windowName}" не поддерживаются:\n"${notsup.join(",")}"`);
        }

        if (this.hasWindow(windowName)) throw Error(`Окно "${windowName}" уже существует`);

        document.title = windowName;
        // ширину нужно передавать в зависимости от attrib
        const window = new SimpleWindow(wnd, vdr && vdr.source);

        const handle = HandleMap.getFreeHandle(this.scenes);
        const scene = new Scene({ handle, vdr, renderer: wnd.renderer });

        const wnameUC = windowName.toUpperCase();
        this.scenesByWinName.set(wnameUC, scene);
        this.windows.set(wnameUC, window);
        this.scenes.set(handle, scene);
        this.windowsBySpaceHandle.set(handle, windowName);

        this.windowWasOpen = true;
        return handle;
    }

    hasWindow(windowName: string): NumBool {
        return this.windows.get(windowName.toUpperCase()) ? 1 : 0;
    }

    getWindow(windowName: string) {
        return this.windows.get(windowName.toUpperCase());
    }

    closeWindow(windowName: string): NumBool {
        if (this.windows.delete(windowName.toUpperCase())) {
            this.windowWasOpen = false;
            return 1;
        }
        return 0;
    }

    getSpace(spaceHandle: number) {
        return this.scenes.get(spaceHandle);
    }

    getWinNameBySpaceHandle(spaceHandle: number): string {
        return this.windowsBySpaceHandle.get(spaceHandle) || "";
    }

    getSpaceByWinName(windowName: string): GraphicSpace | undefined {
        return this.scenesByWinName.get(windowName.toUpperCase());
    }
}
