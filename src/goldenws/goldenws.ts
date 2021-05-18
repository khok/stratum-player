import { ComponentItem, GoldenLayout } from "golden-layout";
import { WindowHost, WindowHostWindow, WindowOptions } from "stratum";

export class GoldenWindow implements WindowHostWindow {
    private handlers = new Set<() => void>();
    constructor(private cmp: ComponentItem) {}
    subwindow(view: HTMLDivElement, options: WindowOptions): WindowHostWindow {
        throw new Error("Method not implemented.");
    }
    close(): void {
        this.cmp.close();
    }
    setTitle(title: string): void {
        this.cmp.setTitle(title);
    }
    on(event: "closed", handler: () => void) {
        if (event !== "closed") return;
        this.cmp.on("beforeItemDestroyed", handler);
        this.handlers.add(handler);
    }
    off(event: "closed", handler?: () => void) {
        if (event !== "closed") return;
        if (handler) {
            this.cmp.removeEventListener("beforeItemDestroyed", handler);
            this.handlers.delete(handler);
        } else {
            this.handlers.forEach((h) => this.cmp.removeEventListener("beforeItemDestroyed", h));
            this.handlers.clear();
        }
    }
}

export class GoldenWS implements WindowHost {
    private l: GoldenLayout;
    constructor(body?: HTMLElement) {
        this.l = new GoldenLayout(body);
        this.l.getComponentEvent = () => {};
        window.addEventListener("resize", () => this.l.updateRootSize());
        // this.l.loadLayout({
        //     root: {
        //         type: "row",
        //         content: [],
        //     },
        //     header: {
        //         close: "Закрыть",
        //         maximise: "Максимизировать",
        //         minimise: "Минимизировать",
        //         popout: "Открыть в новом окне",
        //     },
        // });
    }
    get width(): number {
        return this.l.width ?? window.innerWidth;
    }
    get height(): number {
        return this.l.width ?? window.innerHeight;
    }
    window(view: HTMLDivElement, options: WindowOptions): WindowHostWindow {
        // const cmp = this.l.newComponentAtLocation(null, null, options.title, [{ typeId: 4 }])!;
        const cmp = this.l.newComponent(null, null, options.title);
        // const div = document.createElement("div");
        // div.style.setProperty("width", "100%");
        // div.style.setProperty("height", "100%");
        // div.style.setProperty("overflow", "auto");
        // div.appendChild(view);
        // cmp.container.element.appendChild(div);
        cmp.container.element.appendChild(view);
        return new GoldenWindow(cmp);
    }
}

export function goldenws(element?: HTMLElement) {
    return new GoldenWS(element);
}
