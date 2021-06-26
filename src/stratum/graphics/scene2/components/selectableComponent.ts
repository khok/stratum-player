export interface SelectableComponentArgs {
    selectable: boolean;
}
export class SelectableComponent {
    private _selectable: boolean;
    constructor({ selectable }: SelectableComponentArgs) {
        this._selectable = selectable;
    }
    isSelectable(): boolean {
        return this._selectable;
    }
}
