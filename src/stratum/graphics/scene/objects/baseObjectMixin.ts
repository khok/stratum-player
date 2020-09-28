import { Optional } from "stratum/helpers/utilityTypes";
import { ElementBase } from "stratum/common/fileFormats/vdr/types/vectorDrawingElements";
import { NumBool } from "stratum/vm/types";
import { SceneGroupObject } from ".";

export type ObjectArgs = Optional<ElementBase, "name" | "options">;

export abstract class BaseObjectMixin {
    readonly handle: number;

    private _name: string;

    _parent: SceneGroupObject | undefined;
    protected options: number;
    protected _layer: number = 0;
    protected _isVisible: NumBool = 1;
    protected _selectable: NumBool = 1;

    constructor({ handle, name, options }: ObjectArgs) {
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

    get parent(): SceneGroupObject | undefined {
        return this._parent;
    }

    get name() {
        return this._name;
    }

    setName(name: string): NumBool {
        this._name = name;
        return 1;
    }
}
