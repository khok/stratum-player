import { ToolKeeperComponent } from "../components/toolKeeperComponent";
import { Scene } from "../scene";

export abstract class SceneTool<T extends SceneTool<T> | null> {
    private subs = new Set<ToolKeeperComponent<T>>();
    constructor(readonly scene: Scene, public handle: number = 0) {}

    _subscribe(sub: ToolKeeperComponent<T>): void {
        this.subs.add(sub);
    }
    _unsubscribe(sub: ToolKeeperComponent<T>): void {
        this.subs.delete(sub);
    }
    subCount(): number {
        return this.subs.size;
    }
    protected dispatchChanges() {
        if (this.subs.size === 0) return;
        this.subs.forEach((c) => ++c._ver);
        this.scene._dirty = true;
    }
}
