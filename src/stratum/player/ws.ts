import { WindowHost, WindowHostWindow, WindowOptions } from "stratum/api";

export class SimpleWindow implements WindowHostWindow {
    private origTitle: string;
    constructor(title: string, private view: HTMLDivElement) {
        this.origTitle = document.title;
        if (title) document.title = title;
    }
    setTitle(title: string) {
        document.title = title;
    }
    close(): void {
        this.view.remove();
        document.title = this.origTitle;
    }
    // on(event: "resized", handler: (width: number, height: number) => void): void;
    on() {}
    // on(event: any, handler: any) {}
    // off(event: "resized", handler?: (width: number, height: number) => void): void;
    off() {}
    // off(event: any, handler?: any) {}
    toTop() {}
}

export class SimpleWs implements WindowHost {
    width = window.innerWidth;
    height = window.innerHeight;
    constructor(private root?: HTMLElement) {}

    window({ title, view }: WindowOptions): WindowHostWindow {
        if (!this.root) throw Error(`Не удалось открыть окно ${title}: корень для открытия окна не был указан`);
        this.root.appendChild(view);
        return new SimpleWindow(title, view);
    }
}

export class Wrapper implements WindowHostWindow {
    constructor(private wnd: Window, title: string, view: HTMLDivElement) {
        wnd.document.body.appendChild(view);
        wnd.document.title = title;
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

    toTop() {}

    close() {
        this.off("closed");
        this.wnd.close();
    }
}

export class NativeWs implements WindowHost {
    width: number = window.innerWidth;
    height: number = window.innerHeight;
    window({ title, view }: WindowOptions): WindowHostWindow {
        const wnd = window.open("about:blank", title, `menubar=no,toolbar=no,location=no`);
        if (!wnd) throw Error(`Не удалось открыть окно ${title}`);
        return new Wrapper(wnd, title, view);
    }
}
