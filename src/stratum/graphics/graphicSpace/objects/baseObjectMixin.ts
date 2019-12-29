import { GroupObject, GraphicObject } from ".";

export abstract class BaseObjectMixin {
    protected abstract readonly _subclassInstance: BaseObjectMixin & GraphicObject;
    handle: number = 0;
    private _parent: GroupObject | undefined;
    name: string;
    constructor(data: { name: string }) {
        this.name = data.name;
    }
    set parent(value: GroupObject | undefined) {
        if (this._parent === value) return;
        if (this._parent) this._parent.removeItem(this._subclassInstance);
        this._parent = value;
        if (value) value.addItem(this._subclassInstance);
    }
    get parent(): GroupObject | undefined {
        return this._parent;
    }
}
