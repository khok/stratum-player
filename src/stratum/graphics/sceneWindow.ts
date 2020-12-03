import { WindowHost, WindowHostWindow } from "stratum/api";
import { VectorDrawing } from "stratum/fileFormats/vdr";
import { Constant, EventSubscriber, NumBool } from "stratum/translator";
import { InputWrapper, InputWrapperOptions } from "./html";
import { FabricRenderer } from "./renderers";
import { Scene } from "./scene";

export interface SceneWindowArgs {
    handle: number;
    attribute: string;
    host: WindowHost;
    wname: string;
    vdr?: VectorDrawing;
    disableResize?: boolean;
}

export class SceneWindow {
    private readonly classname: string = "";
    private readonly filename: string = "";
    private rnd: FabricRenderer;
    private disableResize: boolean;

    private wnd: WindowHostWindow;
    private prevWidth: number = 0;
    private prevHeight: number = 0;

    readonly scene: Scene;
    readonly view: HTMLDivElement;

    constructor({ handle, wname, attribute, vdr, host, disableResize }: SceneWindowArgs) {
        this.disableResize = disableResize ?? false;

        if (vdr !== undefined && vdr.source !== undefined) {
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

        const cnv = document.createElement("canvas");
        cnv.style.setProperty("top", "0px");
        cnv.style.setProperty("left", "0px");
        cnv.style.setProperty("position", "absolute");

        const renderer = (this.rnd = new FabricRenderer(cnv, this, handle));
        view.appendChild(cnv);

        const wnd = (this.wnd = host.window({ title: wname, view }));
        wnd.on("closed", () => {
            for (const c of this.closeSubs) c.receive(Constant.WM_SPACEDONE);
        });
        this.prevWidth = this.width;
        this.prevWidth = this.height;
        this.scene = new Scene({ vdr, renderer });
    }

    textInput(options: InputWrapperOptions) {
        return new InputWrapper(this.view, options);
    }

    private closeSubs = new Set<EventSubscriber>();
    onClose(sub: EventSubscriber) {
        this.closeSubs.add(sub);
    }
    offClose(sub: EventSubscriber) {
        this.closeSubs.delete(sub);
    }

    private sizeSubs = new Set<EventSubscriber>();
    onResize(sub: EventSubscriber) {
        this.sizeSubs.add(sub);
    }
    offResize(sub: EventSubscriber) {
        this.sizeSubs.delete(sub);
    }

    onMouse(sub: EventSubscriber, code: Constant, handle: number) {
        this.rnd.onMouse(sub, code, handle);
    }
    offMouse(sub: EventSubscriber, code: Constant) {
        this.rnd.offMouse(sub, code);
    }

    redraw() {
        const { view: body, rnd } = this;
        const nw = body.clientWidth;
        const nh = body.clientHeight;

        let changed = false;
        if (nw !== this.prevWidth) {
            this.prevWidth = nw;
            rnd.setWidth(nw);
            changed = true;
        }
        if (nh !== this.prevHeight) {
            this.prevHeight = nh;
            rnd.setHeight(nh);
            changed = true;
        }
        if (changed) {
            rnd.calcOffset();
            for (const c of this.sizeSubs) c.receive(Constant.WM_SIZE, nw, nh);
        }
        this.rnd.redraw();
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

    get width() {
        const wd = this.view.clientWidth;
        return wd > 0 ? wd : window.innerWidth;
    }

    get height() {
        const wh = this.view.clientHeight;
        return wh > 0 ? wh : window.innerHeight;
    }

    setSize(width: number, height: number): NumBool {
        if (this.disableResize === true) return 1;

        // prettier-ignore
        const { view: { clientWidth, clientHeight, style } } = this;

        if (clientWidth !== width) style.setProperty("width", width + "px");
        if (clientHeight !== height) style.setProperty("height", height + "px");
        return 1;
    }

    toTop(): NumBool {
        this.wnd.toTop();
        return 1;
    }

    setAttrib(flag: number): NumBool {
        return 1;
    }

    originX = 0;
    originY = 0;
    setOrigin(x: number, y: number): NumBool {
        this.originX = x;
        this.originY = y;
        return 1;
    }
}
