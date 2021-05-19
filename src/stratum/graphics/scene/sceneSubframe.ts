import { WindowHostWindow } from "stratum/stratum";
import { WindowRect } from "../sceneWindow";
import { Scene } from "./scene";

export class SceneSubframe implements WindowHostWindow {
    private lastX: number;
    private lastY: number;
    constructor(private view: HTMLDivElement, private scene: Scene, rect: WindowRect) {
        this.lastX = rect.x - scene.originX();
        this.lastY = rect.y - scene.originY();

        view.style.setProperty("position", "absolute");
        view.style.setProperty("left", this.lastX + "px");
        view.style.setProperty("top", this.lastY + "px");
        view.style.setProperty("width", rect.w + "px");
        view.style.setProperty("height", rect.h + "px");
        scene.view.appendChild(view);
    }

    setVisibility(visible: boolean): void {
        this.view.style.setProperty("display", visible ? "block" : "none");
    }

    close(): void {
        this.view.remove();
    }

    moveTo(x: number, y: number): void {
        const newX = x - this.scene.originX();
        const newY = y - this.scene.originY();
        if (newX !== this.lastX || newY !== this.lastY) {
            this.lastX = newX;
            this.lastY = newY;
            this.view.style.setProperty("left", newX + "px");
            this.view.style.setProperty("top", newY + "px");
        }
    }
}
