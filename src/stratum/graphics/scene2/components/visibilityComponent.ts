import { LayersComponent } from "./layersComponent";

export interface VisibilityComponentArgs {
    visible: boolean;
    layer: number;
    layers: LayersComponent;
}

export class VisibilityComponent {
    private _visible: boolean;
    private _layer: number;
    private _layers: LayersComponent;
    constructor({ visible, layer, layers }: VisibilityComponentArgs) {
        this._visible = visible;
        this._layer = layer;
        this._layers = layers;
    }
    isVisible(): boolean {
        // if (!this._visible || (this._layer & layers) !== 0 || this._selectable === 0) return undefined;
        return this._visible && !(this._layer & this._layers.hiddenLayers());
    }
}
