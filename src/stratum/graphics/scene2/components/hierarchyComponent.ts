import { Entity } from "../entity";
import { GroupComponent } from "./groupComponent";

export class HierarchyComponent {
    private _parent: GroupComponent | null = null;
    constructor(readonly entity: Entity) {}

    setParent(parent: GroupComponent | null): void {
        if (this._parent === parent) return;

        const bbox = this.entity.bbox();
        if (this._parent) {
            this._parent.children().delete(bbox);
            this._parent.recalcBorders();
        }
        this._parent = parent;
        if (parent) {
            parent.children().add(bbox);
            parent.recalcBorders();
        }
    }

    onTransformChanged(): void {
        this._parent?.recalcBorders();
    }
}
