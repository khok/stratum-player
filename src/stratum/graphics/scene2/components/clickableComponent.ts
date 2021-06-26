import { SelectableComponent } from "./selectableComponent";
import { VisibilityComponent } from "./visibilityComponent";

export interface ClickableComponentArgs {
    visib: VisibilityComponent;
    selectable: SelectableComponent;
}

export abstract class ClickableComponent {
    private visib: VisibilityComponent;
    private _selectable: SelectableComponent;
    constructor({ visib, selectable }: ClickableComponentArgs) {
        this.visib = visib;
        this._selectable = selectable;
    }
    protected abstract testPoint(x: number, y: number): boolean;
    isPointInShape(x: number, y: number): boolean {
        if (!this.visib.isVisible() || !this._selectable.isSelectable()) return false;
        // if (!this._visible || (this._layer & layers) !== 0 || this._selectable === 0) return undefined;
        return this.testPoint(x, y);
    }
}
