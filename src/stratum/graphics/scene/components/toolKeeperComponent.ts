import { Scene } from "../scene";
import { SceneTool } from "../tools/sceneTool";

export class ToolKeeperComponent<T extends SceneTool<T>> {
    _tool: T | null;
    ver: number = 0;

    constructor(readonly scene: Scene, tool?: T | null) {
        this._tool = tool ?? null;
        tool?._subscribe(this);
    }

    tool(): T | null {
        return this._tool;
    }

    setTool(tool?: T | null): this {
        if (tool === this._tool) return this;

        this._tool?._unsubscribe(this);
        this._tool = tool ?? null;
        tool?._subscribe(this);
        ++this.ver;
        this.scene._dirty = true;
        return this;
    }
}
