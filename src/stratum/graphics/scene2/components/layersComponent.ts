export class LayersComponent {
    private _layers: number;
    constructor(layers: number) {
        this._layers = layers;
    }

    hiddenLayers(): number {
        return this._layers;
    }
}
