import { Element2D } from "../elements/element2d";

export class VisibilityComponent {
    constructor(readonly element: Element2D, private _visible: boolean, private _layer: number) {}
    visible(): boolean {
        return this._visible && (this._layer & this.element.scene._layers) === 0;
    }

    setVisible(visible: boolean): this {
        if (this._visible === visible) return this;
        this._visible = visible;
        this.element.scene._dirty = true;
        return this;
    }
}
