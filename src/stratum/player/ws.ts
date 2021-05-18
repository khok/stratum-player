import { WindowHost, WindowHostWindow, WindowOptions } from "stratum/stratum";

export class SimpleWindow implements WindowHostWindow {
    private origTitle: string;
    private popup: boolean;
    constructor(private root: HTMLElement, private view: HTMLDivElement, { title, popup }: WindowOptions) {
        this.origTitle = document.title;
        if (!popup && title) document.title = this.origTitle ? `${this.origTitle} - ${title}` : title;
        this.popup = popup;
        root.appendChild(view);
    }

    moveTo(x: number, y: number): void {
        if (!this.popup) return;
        this.view.style.setProperty("left", x + "px");
        this.view.style.setProperty("top", y + "px");
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

export class PopupWrapper implements WindowHostWindow {
    constructor(private wnd: Window, { title }: WindowOptions) {
        if (title) wnd.document.title = title;
    }

    subwindow(view: HTMLDivElement, options: WindowOptions): WindowHostWindow {
        const wnd = window.open("about:blank", undefined, `width=${window.innerWidth / 1.5},height=${window.innerHeight / 1.5}`);
        if (!wnd) throw Error(`Не удалось открыть окно ${options.title}`);
        wnd.document.body.appendChild(view);
        return new PopupWrapper(wnd, options);
    }

    private handlers = new Set<() => void>();
    on(event: "closed", handler: () => void) {
        if (event !== "closed") return;
        this.wnd.addEventListener("beforeunload", handler);
        this.handlers.add(handler);
    }
    off(event: "closed", handler?: () => void) {
        if (event !== "closed") return;
        if (handler) {
            this.wnd.removeEventListener("beforeunload", handler);
            this.handlers.delete(handler);
        } else {
            this.handlers.forEach((h) => this.wnd.removeEventListener("beforeunload", h));
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
    window(view: HTMLDivElement, options: WindowOptions): WindowHostWindow {
        if (options.popup) {
            const x = Math.max(options.position?.x ?? 0, 0);
            const y = Math.max(options.position?.y ?? 0, 0);
            view.style.setProperty("position", "absolute");
            view.style.setProperty("left", x + "px");
            view.style.setProperty("top", y + "px");
            view.style.setProperty("box-shadow", "13px 11px 6px 0px rgb(0 0 0 / 50%)");
            //
            view.style.setProperty("opacity", "0");
            view.style.setProperty("transition", "opacity 250ms linear");
            setTimeout(() => view.style.setProperty("opacity", "1"));
        } else {
            //
            view.style.setProperty("opacity", "0");
            view.style.setProperty("transition", "opacity 250ms linear");
            setTimeout(() => view.style.setProperty("opacity", "1"));

            view.setAttribute("class", "stratum-window");
        }
        if (this.root) {
            return new SimpleWindow(this.root, view, options);
        }
        const wnd = window.open("about:blank", undefined, `width=${this.width / 1.5},height=${this.height / 1.5}`);
        if (!wnd) throw Error(`Не удалось открыть окно ${options.title}`);
        wnd.document.body.style.setProperty("margin", "0px");
        wnd.document.body.appendChild(view);
        return new PopupWrapper(wnd, options);
    }
}
