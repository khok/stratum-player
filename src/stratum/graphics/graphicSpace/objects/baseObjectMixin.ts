import { GroupObject, GraphicObject } from ".";

export abstract class BaseObjectMixin {
    protected abstract readonly _subclassInstance: BaseObjectMixin & GraphicObject;
    handle: number;
    _parent: GroupObject | undefined;
    name: string;
    constructor(data: { handle: number; name?: string }) {
        if (data.handle === 0) throw new Error(`handle is zero on on object $${data.name}`);
        this.handle = data.handle;
        this.name = data.name || "";
    }
    get parent(): GroupObject | undefined {
        return this._parent;
    }
}
