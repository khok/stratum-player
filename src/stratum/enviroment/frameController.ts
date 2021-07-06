import { Scene } from "stratum/graphics/scene/scene";
import { Point2D } from "stratum/helpers/types";
import { ViewContainerController, ViewContainerOptions } from "stratum/stratum";

export class FrameController implements ViewContainerController {
    private lastX: number;
    private lastY: number;
    private lastW: number;
    private lastH: number;
    private lastVisible = true;

    private pos: Point2D;

    constructor(private view: HTMLDivElement, private parent: Scene, params: ViewContainerOptions) {
        const pos = params.position ?? { x: 0, y: 0 };
        this.pos = pos;

        this.lastX = pos.x - parent.offsetX();
        this.lastY = pos.y - parent.offsetY();
        this.lastW = params.size?.width ?? 0;
        this.lastH = params.size?.height ?? 0;

        view.style.setProperty("position", "absolute");
        view.style.setProperty("left", this.lastX + "px");
        view.style.setProperty("top", this.lastY + "px");
        view.style.setProperty("width", this.lastW + "px");
        view.style.setProperty("height", this.lastH + "px");
        parent.view.appendChild(view);
    }
    close(): void {
        this.view.remove();
    }

    originX(): number {
        return this.pos.x;
    }
    originY(): number {
        return this.pos.y;
    }

    setOrigin(x: number, y: number): void {
        this.pos = { x, y };
        const newX = x - this.parent.offsetX();
        if (newX !== this.lastX) {
            this.lastX = newX;
            this.view.style.setProperty("left", newX + "px");
        }
        const newY = y - this.parent.offsetY();
        if (newY !== this.lastY) {
            this.lastY = newY;
            this.view.style.setProperty("top", newY + "px");
        }
    }

    setVisibility(visible: boolean): void {
        if (visible === this.lastVisible) return;
        this.lastVisible = visible;
        this.view.style.setProperty("display", visible ? "block" : "none");
    }

    width(): number {
        return this.lastW;
    }
    clientWidth(): number {
        return this.lastW;
    }
    height(): number {
        return this.lastH;
    }
    clientHeight(): number {
        return this.lastH;
    }

    setSize(width: number, height: number): void {
        this.setClientSize(width, height);
    }
    setClientSize(width: number, height: number): void {
        if (this.lastW !== width) {
            this.lastW = width;
            this.view.style.setProperty("width", width + "px");
        }
        if (this.lastH !== height) {
            this.lastH = height;
            this.view.style.setProperty("height", height + "px");
        }
    }
}
