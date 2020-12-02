import { WindowHost, WindowHostWindow, WindowOptions } from "stratum/api";

export class SimpleWindow implements WindowHostWindow {
    private origTitle: string;
    constructor(private view: HTMLDivElement, title?: string) {
        this.origTitle = document.title;
        if (title) document.title = this.origTitle ? `${this.origTitle} - ${title}` : title;
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
    on() {}
    off() {}
    toTop() {}
}

export class PopupWrapper implements WindowHostWindow {
    constructor(private wnd: Window, title?: string) {
        if (title) wnd.document.title = title;
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
    sizedOnce = false;
    setSize(width: number, height: number) {
        if (this.sizedOnce === true) return;
        const { wnd } = this;
        wnd.addEventListener("resize", () => wnd.resizeTo(width + wnd.outerWidth - wnd.innerWidth + 15, height + wnd.outerHeight - wnd.innerHeight + 15), {
            once: true,
        });
        this.sizedOnce = true;
    }

    toTop() {}

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
    window({ title, view }: WindowOptions): WindowHostWindow {
        if (this.root) {
            this.root.appendChild(view);
            return new SimpleWindow(view, title);
        }
        const wnd = window.open("about:blank", undefined, `width=${this.width / 1.5},height=${this.height / 1.5}`);
        if (!wnd) throw Error(`Не удалось открыть окно ${title}`);
        wnd.document.body.appendChild(view);
        return new PopupWrapper(wnd, title);
    }
}
