import { ToolKeeperComponent } from "./toolKeeperComponent";

export class ToolComponent<T extends ToolComponent<T>> {
    private subs = new Set<ToolKeeperComponent<T>>();
    protected changed: boolean = true;
    constructor(public handle: number) {}

    subscribe(sub: ToolKeeperComponent<T>): void {
        this.subs.add(sub);
    }
    unsubscribe(sub: ToolKeeperComponent<T>): void {
        this.subs.delete(sub);
    }
    subCount(): number {
        return this.subs.size;
    }
    protected dispatchChanges() {
        this.changed = true;
        this.subs.forEach((c) => c.onToolChanged());
    }
}
