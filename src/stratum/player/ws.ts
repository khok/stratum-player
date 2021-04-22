import { WindowHost, WindowHostWindow, WindowOptions } from "stratum/stratum";

export class SimpleWindow implements WindowHostWindow {
    private origTitle: string;
    constructor(private root: HTMLElement, private view: HTMLDivElement, { title }: WindowOptions) {
        this.origTitle = document.title;
        if (title) document.title = this.origTitle ? `${this.origTitle} - ${title}` : title;
        root.appendChild(view);
    }
    subwindow(view: HTMLDivElement, options: WindowOptions): WindowHostWindow {
        return new SimpleWindow(this.root, view, options);
    }
    setTitle(title: string) {
        document.title = title;
    }
    setSize(width: number, height: number) {
        // prettier-ignore
        const { view: { clientWidth, clientHeight, style } } = this;
        if (clientWidth !== width) style.setProperty("width", width + "px");
        if (clientHeight !== height) style.setProperty("height", height + "px");
    }
    close(): void {
        this.view.remove();
        document.title = this.origTitle;
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
    setSize(width: number, height: number) {
        if (this.sizedOnce === true) return;
        const { wnd } = this;
        wnd.addEventListener("resize", () => wnd.resizeTo(width + wnd.outerWidth - wnd.innerWidth + 15, height + wnd.outerHeight - wnd.innerHeight + 15), {
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
    constructor(private root?: HTMLElement) {}

    get width() {
        return window.innerWidth;
    }
    get height() {
        return window.innerHeight;
    }
    window(view: HTMLDivElement, options: WindowOptions): WindowHostWindow {
        if (this.root) {
            return new SimpleWindow(this.root, view, options);
        }
        const wnd = window.open("about:blank", undefined, `width=${this.width / 1.5},height=${this.height / 1.5}`);
        if (!wnd) throw Error(`Не удалось открыть окно ${options.title}`);
        wnd.document.body.appendChild(view);
        return new PopupWrapper(wnd, options);
    }
}
