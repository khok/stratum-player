import SchemeInstance from "./schemeInstance";

export default class Window {
    private _name: string;
    private _canvas: HTMLCanvasElement;
    private _space?: SchemeInstance;
    constructor(name: string, flags: string, canvas?: HTMLCanvasElement) {
        if (!canvas) throw new Error("multiwindow not imppemeneted");
        this._name = name;
        this._canvas = canvas;
    }

    setSchemeInstance(space: SchemeInstance) {
        this._space = space;
    }

    get space() {
        return this._space;
    }

    get name() {
        return this._name;
    }

    get canvas() {
        return this._canvas;
    }
}
