import { WindowHost, WindowHostWindow, WindowOptions } from "stratum/api";

export class SimpleWindow implements WindowHostWindow {
    constructor(public container: HTMLElement, public title: string) {}
    on(event: "resized", handler: (width: number, height: number) => void): void;
    on(event: "closed", handler: () => void): void;
    on(event: any, handler: any) {
        throw new Error("Method not implemented.");
    }
    off(event: "resized", handler?: (width: number, height: number) => void): void;
    off(event: "closed", handler?: () => void): void;
    off(event: any, handler?: any) {
        throw new Error("Method not implemented.");
    }
    close(): void {
        throw new Error("Method not implemented.");
    }
}

export class SimpleWs implements WindowHost {
    width: number = 1920;
    height: number = 1080;
    constructor(private root: HTMLElement) {}
    window(options?: WindowOptions): WindowHostWindow {
        const title = options?.title || "Новое окно";
        document.title = title;
        return new SimpleWindow(this.root, title);
    }
}
