import { GroupObject, GraphicObject } from ".";

export abstract class BaseObjectMixin {
    protected abstract readonly _subclassInstance: BaseObjectMixin & GraphicObject;
    handle: number = 0;
    _parent: GroupObject | undefined;
    name: string;
    constructor(data: { name: string }) {
        this.name = data.name;
    }
    get parent(): GroupObject | undefined {
        return this._parent;
    }
}
