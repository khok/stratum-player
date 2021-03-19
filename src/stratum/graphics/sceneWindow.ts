import { WindowHost, WindowHostWindow } from "stratum/api";
import { SmoothComputer } from "stratum/common/computers";
import { Constant, Env, EventSubscriber, NumBool } from "stratum/env";
import { HTMLFactory, InputWrapper, InputWrapperOptions, Scene } from "./scene";

export class SceneWindow implements Env.Window, HTMLFactory {
    private static updater = new SmoothComputer();
    private static wins = new Set<SceneWindow>();
    private static redrawAll(): boolean {
        SceneWindow.wins.forEach((w) => w.redraw());
        return SceneWindow.wins.size > 0;
    }

    private readonly classname: string = "";
    private readonly filename: string = "";
    private resizible: boolean;
    private ignoreSetSize: boolean;

    private wnd: WindowHostWindow;

    readonly scene: Scene;
    readonly view: HTMLDivElement;
    private readonly cnv: HTMLCanvasElement;
    private _title: string;
    private ctx: CanvasRenderingContext2D;

    private noCaption: boolean;

    constructor(host: WindowHost, args: Env.WindowArgs) {
        this.ignoreSetSize = args.disableResize ?? false;
        this.noCaption = !!args.noCaption;

        if (args.vdr) {
            this.resizible = !args.vdr.otDATAITEMS?.some((d) => d.id === 11);
            const { name, origin } = args.vdr.source;
            if (origin === "class") this.classname = name;
            else if (origin === "file") this.filename = name;
        } else {
            this.resizible = true;
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

        this.wnd = host.window({ title: args.noCaption ? undefined : args.title, view });
        cnv.width = this.width();
        cnv.height = this.height();
        this._title = args.title;

        const ctx = cnv.getContext("2d", { alpha: false });
        if (!ctx) throw Error("Не удалось инициализировать контекст рендеринга");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, this.cnv.width, this.cnv.height);
        this.ctx = ctx;

        const scene = (this.scene = new Scene(this, args.vdr));
        const handler = (evt: PointerEvent) => {
            scene.pointerEventHandler(evt);
            cnv.style.cursor = scene.cursor;
        };
        cnv.addEventListener("pointerdown", handler);
        cnv.addEventListener("pointerup", handler);
        cnv.addEventListener("pointerleave", handler);
        cnv.addEventListener("pointermove", handler);

        SceneWindow.wins.add(this);
        SceneWindow.updater.run(SceneWindow.redrawAll);

        const cl = args.onClosed;
        this.wnd.on("closed", () => {
            SceneWindow.wins.delete(this);
            this.spaceDoneSubs.forEach((c) => c.receive(Constant.WM_SPACEDONE));
            cl && cl();
        });
    }

    textInput(options: InputWrapperOptions) {
        return new InputWrapper(this.view, options);
    }

    redraw() {
        const nw = this.view.clientWidth;
        const nh = this.view.clientHeight;

        const sizeChanged = nw !== this.cnv.width || nh !== this.cnv.height;

        if (sizeChanged) {
            this.cnv.width = nw;
            this.cnv.height = nh;
            for (const c of this.sizeSubs) c.receive(Constant.WM_SIZE, nw, nh);
        }

        if (sizeChanged || this.scene.dirty) {
            this.scene.render(this.ctx);
            this.scene.dirty = false;
        }
    }

    close(): void {
        SceneWindow.wins.delete(this);
        this.wnd.close();
        this.spaceDoneSubs.forEach((c) => c.receive(Constant.WM_SPACEDONE));
    }

    getProp(prop: string): string {
        const propUC = prop.toUpperCase();
        if (propUC === "CLASSNAME") return this.classname;
        if (propUC === "FILENAME") return this.filename;
        return "";
    }

    width() {
        const wd = this.view.clientWidth;
        return wd > 0 ? wd : 300;
    }

    height() {
        const wh = this.view.clientHeight;
        return wh > 0 ? wh : 200;
    }

    setSize(width: number, height: number): NumBool {
        if (this.ignoreSetSize === true) return 1;
        this.wnd.setSize(width, height);
        if (this.resizible === true) return 1;
        this.view.style.setProperty("width", width + "px");
        this.view.style.setProperty("height", height + "px");
        return 1;
    }

    toTop(): NumBool {
        this.wnd.toTop();
        return 1;
    }

    setAttrib(flag: number): NumBool {
        switch (flag) {
            case Constant.SW_HIDE:
                this.view.style.setProperty("visibility", "hidden");
                break;
            case Constant.SW_SHOW:
                this.view.style.removeProperty("visibility");
                break;
        }
        return 1;
    }

    title(): string {
        return this._title;
    }

    setTitle(title: string): NumBool {
        this._title = title;
        if (!this.noCaption) this.wnd.setTitle(title);
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

    setTransparent(level: number): NumBool {
        return 1;
    }
    setTransparentColor(cref: number): NumBool {
        return 1;
    }

    private spaceDoneSubs = new Set<EventSubscriber>();
    private closeSubs = new Set<EventSubscriber>();
    private sizeSubs = new Set<EventSubscriber>();

    onSpaceDone(sub: EventSubscriber) {
        this.spaceDoneSubs.add(sub);
    }
    offSpaceDone(sub: EventSubscriber) {
        this.spaceDoneSubs.delete(sub);
    }
    onDestroy(sub: EventSubscriber): void {
        this.closeSubs.add(sub);
    }
    offDestroy(sub: EventSubscriber): void {
        this.closeSubs.delete(sub);
    }
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
}
