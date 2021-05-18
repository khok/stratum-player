import { SmoothExecutor } from "stratum/common/computers";
import { Constant } from "stratum/common/constant";
import { EventSubscriber, NumBool } from "stratum/common/types";
import { VdrMerger } from "stratum/common/vdrMerger";
import { VDRSource, VectorDrawing, WindowStyle } from "stratum/fileFormats/vdr";
import { WindowHostWindow, WindowOptions } from "stratum/stratum";
import { Scene } from "./scene";
import { NotResizable, Resizable } from "./scene/resizable";
import { WindowAttribs } from "./windowAttribs";

export interface WindowRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface GetWindow {
    (view: HTMLDivElement, options: WindowOptions): WindowHostWindow;
}

export interface WindowArgs {
    handle: number;
    wname: string;
    attribs: WindowAttribs;
    vdr?: VectorDrawing | null;
    rect?: WindowRect;
    onClosed?: Function;
}

export interface SubwindowArgs {
    handle: number;
    wname: string;
    rect: WindowRect;
    vdr?: VectorDrawing | null;
    onClosed?: Function;
}

export class SceneWindow<T = unknown> {
    private static updater = new SmoothExecutor();
    private static wins = new Set<SceneWindow>();
    private static redrawAll(): boolean {
        SceneWindow.wins.forEach((w) => w.redraw());
        return SceneWindow.wins.size > 0;
    }

    private parent: SceneWindow | null = null;
    private childWindows = new Set<SceneWindow>();

    private _title: string;

    private readonly closeCallback: () => void;

    // readonly popup: boolean;

    readonly host: WindowHostWindow;
    readonly scene: Scene;
    readonly sceneHandle: number;
    readonly name: string;
    readonly source: VDRSource | null;

    projectID: T | null;
    constructor(args: WindowArgs, getWindow: GetWindow) {
        this.sceneHandle = args.handle;
        this.name = this._title = args.wname;
        this.source = args.vdr?.source ?? null;
        this.projectID = null;

        const attribs = args.attribs;

        //Парсинг настроек
        let width = 300;
        let height = 200;
        let popup = false;
        let autoorg = false;
        let bySpaceSize = false;
        let noResize = false;

        if (attribs.useVdrSettings && args.vdr?.settings) {
            const settings = args.vdr.settings;
            const style = settings.style;

            if (settings.x) width = settings.x;
            if (settings.y) height = settings.y;
            if (style & WindowStyle.SWF_POPUP) popup = true;
            if (style & WindowStyle.SWF_AUTOORG) autoorg = true;
            if (style & WindowStyle.SWF_SPACESIZE) bySpaceSize = true;
            if (style & WindowStyle.SWF_NORESIZE) noResize = true;
        }

        if (attribs.popup) popup = true;
        if (attribs.autoOrg) autoorg = true;
        if (attribs.bySpaceSize) bySpaceSize = true;
        if (popup || attribs.noResize) noResize = true;

        if (args.vdr?.elements && (autoorg || bySpaceSize)) {
            const org = VdrMerger.calcRect(args.vdr.elements);
            if (autoorg) {
                args.vdr.origin.x = org.x;
                args.vdr.origin.y = org.y;
            }
            if (bySpaceSize) {
                width = org.w;
                height = org.h;
            }
        }
        if (args.rect?.w) width = args.rect.w;
        if (args.rect?.h) height = args.rect.h;
        //Конец парсинга

        // this.popup = popup;

        const sizeInfo: Resizable | NotResizable = noResize ? { resizable: false, width, height } : { resizable: true };
        this.scene = new Scene({ wnd: this, vdr: args.vdr, sizeInfo });

        // const view = document.createElement("div");
        // view.appendChild(this.scene.view);

        this.host = getWindow(this.scene.view, {
            popup,
            title: args.wname,
            noCaption: attribs?.noCaption,
            noShadow: attribs?.noShadow,
            position: args.rect,
        });

        this.closeCallback = () => {
            this.parent?.childWindows.delete(this);
            SceneWindow.wins.delete(this);
            this.childWindows.forEach((w) => w.close());
            if (args.onClosed) args.onClosed();
            this.spaceDoneSubs.forEach((c) => c.receive(Constant.WM_SPACEDONE));
        };
        if (this.host.on) this.host.on("closed", this.closeCallback);

        SceneWindow.wins.add(this);
        SceneWindow.updater.run(SceneWindow.redrawAll);
        this.redraw();
    }

    subwindow(args: SubwindowArgs): SceneWindow<T> {
        const windowArgs: WindowArgs = { ...args, attribs: { noResize: true } };
        const wnd = new SceneWindow<T>(windowArgs, (view) => this.scene.frame(view, args.rect));
        wnd.parent = this;
        this.childWindows.add(wnd);
        return wnd;
    }

    close(): NumBool {
        if (this.host.off) this.host.off("closed", this.closeCallback);
        if (this.host.close) this.host.close();
        this.closeCallback();
        return 1;
    }

    // private lastViewW = 0;
    // private lastViewH = 0;
    private redraw(): void {
        this.scene.render();
    }

    width(): number {
        return this.scene.width();
    }

    clientWidth(): number {
        return this.scene.width();
    }

    height(): number {
        return this.scene.height();
    }

    clientHeight(): number {
        return this.scene.height();
    }

    setClientSize(width: number, height: number): NumBool {
        this.scene.setSize(width, height);
        if (this.host.resizeTo) this.host.resizeTo(width, height);
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
        // if (!this.parent && this.type !== "popup") return 1;
        this._originX = x;
        this._originY = y;
        // this.moveSubs.forEach((c) => c.receive(Constant.WM_MOVE, x, y));
        if (this.host.moveTo) this.host.moveTo(x, y);
        return 1;
    }

    toTop(): NumBool {
        if (this.host.toTop) this.host.toTop();
        return 1;
    }

    setAttrib(flag: number): NumBool {
        switch (flag) {
            case Constant.SW_HIDE:
                if (this.host.setVisibility) this.host.setVisibility(false);
                break;
            case Constant.SW_SHOW:
            case Constant.SW_NORMAL:
                if (this.host.setVisibility) this.host.setVisibility(true);
                break;
        }
        return 1;
    }

    title(): string {
        return this._title;
    }

    setTitle(title: string): NumBool {
        this._title = title;
        if (this.host.setTitle) this.host.setTitle(title);
        return 1;
    }

    setTransparent(level: number): NumBool {
        return 1;
    }
    setTransparentColor(cref: number): NumBool {
        return 1;
    }

    private spaceDoneSubs = new Set<EventSubscriber>();
    // private closeSubs = new Set<EventSubscriber>();
    private moveSubs = new Set<EventSubscriber>();

    on(sub: EventSubscriber, code: Constant, handle: number): void {
        switch (code) {
            case Constant.WM_MOVE:
                this.moveSubs.add(sub);
                break;
            case Constant.WM_SPACEDONE:
                this.spaceDoneSubs.add(sub);
                break;
            // case Constant.WM_DESTROY:
            //     this.closeSubs.add(sub);
            //     break;
            default:
                this.scene.on(sub, code, handle);
        }
    }

    off(sub: EventSubscriber, code: Constant): void {
        switch (code) {
            case Constant.WM_MOVE:
                this.moveSubs.delete(sub);
                break;
            case Constant.WM_SPACEDONE:
                this.spaceDoneSubs.delete(sub);
                break;
            // case Constant.WM_DESTROY:
            //     this.closeSubs.delete(sub);
            //     break;
            default:
                this.scene.off(sub, code);
                break;
        }
    }
}
