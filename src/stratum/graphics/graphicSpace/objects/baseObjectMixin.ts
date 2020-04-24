import { VmBool } from "vm-interfaces-core";
import { GroupObject } from ".";

export interface ObjectOptions {
    handle: number;
    options?: number;
    name?: string;
}

export abstract class BaseObjectMixin {
    readonly handle: number;
    private _name: string;
    protected options: number;
    _parent: GroupObject | undefined;
    protected _layer: number = 0;
    protected _isVisible: VmBool = 1;
    protected _selectable: VmBool = 1;
    constructor({ handle, name, options }: ObjectOptions) {
        if (handle === 0) throw new Error(`Объект ${name} имеет нулевой дескриптор.`);
        this.handle = handle;
        this._name = name || "";
        this.options = options || 0;
        if (options) {
            this._isVisible = options & 1 ? 0 : 1;
            this._selectable = options & 8 ? 0 : 1;
            this._layer = (options & 7936) >> 8;
        }
    }

    get parent(): GroupObject | undefined {
        return this._parent;
    }

    get name() {
        return this._name;
    }

    setName(name: string): VmBool {
        this._name = name;
        return 1;
    }
}
