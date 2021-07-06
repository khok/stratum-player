import { ViewContainerController, ViewContainerOptions, WindowHost } from "stratum/stratum";

export class SimpleWindow implements ViewContainerController {
    private origTitle: string;
    private popup: boolean;

    private lastW: number;
    private lastH: number;

    constructor(private root: HTMLElement, private view: HTMLElement, { title, isPopup, size }: ViewContainerOptions) {
        this.origTitle = document.title;
        if (!isPopup && title) document.title = this.origTitle ? `${this.origTitle} - ${title}` : title;
        this.popup = isPopup;
        root.appendChild(view);
        this.lastW = size?.width ?? view.clientWidth;
        this.lastH = size?.height ?? view.clientHeight;
    }

    width(): number {
        return this.view.clientWidth;
    }
    clientWidth(): number {
        return this.view.clientWidth;
    }
    height(): number {
        return this.view.clientHeight;
    }
    clientHeight(): number {
        return this.view.clientHeight;
    }

    private ox: number = 0;
    private oy: number = 0;

    originX(): number {
        return this.ox;
    }

    originY(): number {
        return this.oy;
    }

    setOrigin(x: number, y: number): void {
        this.ox = x;
        this.oy = y;
        if (!this.popup) return;
        this.view.style.setProperty("left", x + "px");
        this.view.style.setProperty("top", y + "px");
    }

    setSize(x: number, y: number): void {
        console.log("size", x, y);
    }

    setClientSize(x: number, y: number): void {
        // console.log("client", x, y);
        this.view.style.setProperty("width", x.toString());
        this.view.style.setProperty("height", y.toString());
    }

    setTitle(title: string) {
        document.title = title;
    }
    setVisibility(visible: boolean): void {
        this.view.style.setProperty("display", visible ? "block" : "none");
    }
    // setSize(width: number, height: number) {
    //     // prettier-ignore
    //     const { view: { clientWidth, clientHeight, style } } = this;
    //     if (clientWidth !== width) style.setProperty("width", width + "px");
    //     if (clientHeight !== height) style.setProperty("height", height + "px");
    // }
    close(): void {
        if (this.popup) {
            this.view.style.opacity = "0";
            setTimeout(() => this.view.remove(), 250);
        } else {
            this.view.style.opacity = "0";
            setTimeout(() => this.view.remove(), 250);
            // this.view.remove();
            document.title = this.origTitle;
        }
    }
}

export class PopupWrapper implements ViewContainerController {
    constructor(private wnd: Window, { title }: ViewContainerOptions) {
        if (title) wnd.document.title = title;
    }

    // subwindow(view: HTMLElement, options: ViewContainerOptions): ViewContainerController {
    //     const wnd = window.open("about:blank", undefined, `width=${window.innerWidth / 1.5},height=${window.innerHeight / 1.5}`);
    //     if (!wnd) throw Error(`Не удалось открыть окно ${options.title}`);
    //     wnd.document.body.appendChild(view);
    //     return new PopupWrapper(wnd, options);
    // }

    private handlers = new Set<Function>();
    on(event: "moved" | "resized" | "closed", callback: Function) {
        if (event !== "closed") return;
        this.wnd.addEventListener("beforeunload", callback as () => void);
        this.handlers.add(callback);
    }
    off(event: "moved" | "resized" | "closed", callback?: Function) {
        if (event !== "closed") return;
        if (callback) {
            this.wnd.removeEventListener("beforeunload", callback as () => void);
            this.handlers.delete(callback);
        } else {
            this.handlers.forEach((h) => this.wnd.removeEventListener("beforeunload", h as () => void));
            this.handlers.clear();
        }
    }
    setTitle(title: string) {
        this.wnd.document.title = title;
    }
    private sizedOnce = false;
    resizeTo(width: number, height: number) {
        if (this.sizedOnce === true) return;
        const { wnd } = this;
        wnd.addEventListener("resize", () => wnd.resizeTo(width + wnd.outerWidth - wnd.innerWidth, height + wnd.outerHeight - wnd.innerHeight), {
            once: true,
        });
        this.sizedOnce = true;
    }

    close() {
        this.off("closed");
        this.wnd.close();
    }
}

export class SimpleWs implements WindowHost {
    constructor(private root?: HTMLElement) {
        root?.style.setProperty("position", "relative");
    }

    get width() {
        return window.innerWidth;
    }
    get height() {
        return window.innerHeight;
    }
    append(view: Element, options: ViewContainerOptions): ViewContainerController {
        const container = document.createElement("div");
        if (options.isPopup) {
            const x = Math.max(options.position?.x ?? 0, 0);
            const y = Math.max(options.position?.y ?? 0, 0);
            container.style.setProperty("position", "absolute");
            container.style.setProperty("left", x + "px");
            container.style.setProperty("top", y + "px");
            container.style.setProperty("box-shadow", "13px 11px 6px 0px rgb(0 0 0 / 50%)");
            //
        } else {
            container.setAttribute("class", "stratum-window");
        }
        container.style.setProperty("opacity", "0");
        container.style.setProperty("transition", "opacity 250ms linear");
        setTimeout(() => container.style.setProperty("opacity", "1"));
        container.style.setProperty("width", options.size ? options.size.width + "px" : "100%");
        container.style.setProperty("height", options.size ? options.size.height + "px" : "100%");
        container.appendChild(view);

        if (this.root) {
            return new SimpleWindow(this.root, container, options);
        }
        const wnd = window.open("about:blank", undefined, `width=${this.width / 1.5},height=${this.height / 1.5}`);
        if (!wnd) throw Error(`Не удалось открыть окно ${options.title}`);
        wnd.document.body.style.setProperty("margin", "0px");
        wnd.document.body.appendChild(container);
        return new PopupWrapper(wnd, options);
    }
}
