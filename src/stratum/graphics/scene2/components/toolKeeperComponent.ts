import { ToolComponent } from "./toolComponent";

export class ToolKeeperComponent<T extends ToolComponent<T>> {
    private _tool: T | null;
    private _changed: boolean;
    constructor(tool?: T | null) {
        this._tool = tool ?? null;
        tool?.subscribe(this);
        this._changed = true;
    }
    tool(): T | null {
        return this._tool;
    }
    setTool(tool?: T | null): void {
        this._tool?.unsubscribe(this);
        this._tool = tool ?? null;
        tool?.subscribe(this);
        this._changed = true;
    }
    changed(): boolean {
        return this._changed;
    }
    reset(): void {
        this._changed = false;
    }
    onToolChanged(): void {
        this._changed = true;
    }
}
