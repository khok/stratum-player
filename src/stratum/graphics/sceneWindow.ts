import { WindowHost, WindowHostWindow } from "stratum/api";
import { Constant, EventSubscriber, NumBool } from "stratum/env";
import { VectorDrawing } from "stratum/fileFormats/vdr";
import { InputWrapper, InputWrapperOptions, Scene } from "./scene";
import { HTMLFactory } from "./scene/scene";

export interface SceneWindowArgs {
    handle: number;
    attribute: string;
    host: WindowHost;
    wname: string;
    vdr?: VectorDrawing;
    disableResize?: boolean;
}

export class SceneWindow implements HTMLFactory {
    private readonly classname: string = "";
    private readonly filename: string = "";
    private resizible: boolean;
    private ignoreSetSize: boolean;

    private wnd: WindowHostWindow;

    readonly scene: Scene;
    readonly view: HTMLDivElement;
    private readonly cnv: HTMLCanvasElement;

    constructor({ handle, wname, attribute, vdr, host, disableResize }: SceneWindowArgs) {
        this.ignoreSetSize = disableResize ?? false;
        this.resizible = vdr?.otDATAITEMS?.some((d) => d.id === 11) ? false : true;

        if (vdr?.source) {
            const { name, origin } = vdr.source;
            if (origin === "class") this.classname = name;
            else if (origin === "file") this.filename = name;
        }

        // ширину нужно задавать в зависимости от attrib
        // const attribs = attribute.split("|").map((c) => c.trim().toUpperCase());

        const view = (this.view = document.createElement("div"));
        view.style.setProperty("position", "relative");
        view.style.setProperty("overflow", "hidden");
        view.style.setProperty("width", "100%");
        view.style.setProperty("height", "100%");

        const cnv = (this.cnv = document.createElement("canvas"));
        cnv.style.setProperty("top", "0px");
        cnv.style.setProperty("left", "0px");
        cnv.style.setProperty("position", "absolute");
        // cnv.style.setProperty("touch-action", "pan-x pan-y");
        cnv.style.setProperty("touch-action", "pinch-zoom");

        view.appendChild(cnv);

        this.wnd = host.window({ title: attribute.toUpperCase().includes("WS_NOCAPTION") ? undefined : wname, view });
        cnv.width = this.width();
        cnv.height = this.height();
        this.scene = new Scene(cnv, this, vdr);
    }

    textInput(options: InputWrapperOptions) {
        return new InputWrapper(this.view, options);
    }

    private closeSubs = new Set<EventSubscriber>();
    onSpaceDone(sub: EventSubscriber) {
        this.closeSubs.add(sub);
    }
    offClose(sub: EventSubscriber) {
        this.closeSubs.delete(sub);
    }
    dispatchClose() {
        for (const c of this.closeSubs) c.receive(Constant.WM_SPACEDONE);
    }

    private sizeSubs = new Set<EventSubscriber>();
    onResize(sub: EventSubscriber) {
        this.sizeSubs.add(sub);
    }
    offResize(sub: EventSubscriber) {
        this.sizeSubs.delete(sub);
    }

    onControlNotifty(sub: EventSubscriber, handle: number) {
        this.scene.onControlNotify(sub, handle);
    }
    offControlNotify(sub: EventSubscriber) {
        this.scene.offControlNotify(sub);
    }

    onMouse(sub: EventSubscriber, code: Constant, handle: number) {
        this.scene.onMouse(sub, code, handle);
    }
    offMouse(sub: EventSubscriber, code: Constant) {
        this.scene.offMouse(sub, code);
    }

    redraw() {
        const { view, scene } = this;
        const nw = view.clientWidth;
        const nh = view.clientHeight;

        if (nw !== this.cnv.width || nh !== this.cnv.height) {
            this.cnv.width = nw;
            this.cnv.height = nh;
            for (const c of this.sizeSubs) c.receive(Constant.WM_SIZE, nw, nh);
            scene.dirty = true;
        }
        scene.render();
    }

    close() {
        this.wnd.close();
    }

    getProp(prop: string): string {
        const propUC = prop.toUpperCase();
        if (propUC === "CLASSNAME") return this.classname;
        if (propUC === "FILENAME") return this.filename;
        return "";
    }

    width() {
        const wd = this.view.clientWidth;
        return wd > 0 ? wd : window.innerWidth;
    }

    height() {
        const wh = this.view.clientHeight;
        return wh > 0 ? wh : window.innerHeight;
    }

    setSize(width: number, height: number): NumBool {
        if (this.ignoreSetSize === true) return 1;
        this.wnd.setSize(width, height);
        if (this.resizible === true) return 1;
        // prettier-ignore
        const { view: { style } } = this;
        style.setProperty("width", width + "px");
        style.setProperty("height", height + "px");
        return 1;
    }

    toTop(): NumBool {
        this.wnd.toTop();
        return 1;
    }

    setAttrib(flag: number): NumBool {
        return 1;
    }

    private _originX = 0;
    private _originY = 0;
    originX(): number {
        return this._originX;
    }
    originY(): number {
        return this._originY;
    }
    setOrigin(x: number, y: number): NumBool {
        this._originX = x;
        this._originY = y;
        return 1;
    }
}
