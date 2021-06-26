import { BoundingBoxComponent } from "./boundingBoxComponent";
import { GroupComponent } from "./groupComponent";

export interface HierarchyComponentArgs {
    bbox: BoundingBoxComponent;
}

export class HierarchyComponent {
    private _parent: GroupComponent | null = null;
    private bbox: BoundingBoxComponent;
    constructor({ bbox }: HierarchyComponentArgs) {
        this.bbox = bbox;
    }

    parent(): GroupComponent | null {
        return this._parent;
    }

    setParent(parent: GroupComponent | null): void {
        if (this._parent === parent) return;

        if (this._parent) {
            this._parent.children().delete(this.bbox);
        }
        this._parent = parent;
        if (parent) {
            parent.children().add(this.bbox);
        }
    }
}
