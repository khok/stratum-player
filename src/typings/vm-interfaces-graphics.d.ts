declare module "vm-interfaces-graphics" {
    import { VmBool, GraphicSpaceResolver } from "vm-interfaces-core";
    import { GraphicSpaceState } from "vm-interfaces-gspace";
    export interface WindowState {
        readonly space: GraphicSpaceState;
        readonly originX: number;
        readonly originY: number;
        setOrigin(x: number, y: number): VmBool;

        readonly width: number;
        readonly height: number;
        setSize(width: number, height: number): VmBool;

        getProp(prop: "classname" | "filename"): string;
    }

    export interface GraphicSystemController {
        readonly areaOriginX: number;
        readonly areaOriginY: number;
        readonly areaWidth: number;
        readonly areaHeight: number;

        readonly screenHeight: number;
        readonly screenWidth: number;

        createSchemeWindow(windowName: string, flags: string, schemeResolver: GraphicSpaceResolver): number;
        hasWindow(windowName: string): VmBool;
        getWindow(windowName: string): WindowState | undefined;
        getSpace(spaceHandle: number): GraphicSpaceState | undefined;
        getWindowBySpaceHandle(spaceHandle: number): string | undefined;
    }
}
