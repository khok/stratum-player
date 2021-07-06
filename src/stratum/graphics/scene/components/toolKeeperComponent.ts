import { Scene } from "../scene";
import { SceneTool } from "../tools/sceneTool";

export class ToolKeeperComponent<T extends SceneTool<T> | null> {
    _tool: T;
    _ver: number = 0;

    constructor(readonly scene: Scene, tool: T) {
        this._tool = tool;
        tool?._subscribe(this);
    }

    tool(): T {
        return this._tool;
    }

    setTool(tool: T): this {
        if (tool === this._tool) return this;

        this._tool?._unsubscribe(this);
        this._tool = tool;
        tool?._subscribe(this);
        ++this._ver;
        this.scene._dirty = true;
        return this;
    }

    forceUnsub(): void {
        this._tool?._unsubscribe(this);
    }
}
