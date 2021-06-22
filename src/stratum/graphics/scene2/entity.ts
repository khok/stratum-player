import { BoundingBoxComponent } from "./components/boundingBoxComponent";
import { HierarchyComponent } from "./components/hierarchyComponent";
import { MatrixComponent } from "./components/matrixComponent";
import { TransformComponent } from "./components/transformComponent";

//declare function addEventListener<K extends keyof WindowEventMap>(type: K, listener: (this: Window, ev: WindowEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;

// export interface EntityEventType {
//     moved: [dx: number, dy: number];
//     rotated: [ox: number, oy: number, angle: number];
//     scaled: [ox: number, oy: number, dx: number, dy: number];
//     "bounding-box-changed": [minX: number, minY: number, maxX: number, maxY: number];
//     "points-changed": [coords: number[], index?: number];
// }

export interface EntityArgs {
    handle: number;
    name?: string;
    bbox: BoundingBoxComponent;
    matrix: MatrixComponent;
}

export class Entity {
    private _handle: number;
    private _name: string;
    private _matrix: MatrixComponent;
    private _bbox: BoundingBoxComponent;
    private _transform = new TransformComponent(this);
    private _hier = new HierarchyComponent(this);
    constructor({ handle, bbox, matrix, name }: EntityArgs) {
        this._handle = handle;
        this._bbox = bbox;
        this._matrix = matrix;
        this._name = name ?? "";
    }
    handle(): number {
        return this._handle;
    }
    name(): string {
        return this._name;
    }
    setName(name: string): void {
        this._name = name;
    }
    matrix(): MatrixComponent {
        return this._matrix;
    }
    bbox(): BoundingBoxComponent {
        return this._bbox;
    }
    transform(): TransformComponent {
        return this._transform;
    }
    hier(): HierarchyComponent {
        return this._hier;
    }

    // on<K extends keyof EntityEventType>(event: K, receiver: (...args: EntityEventType[K]) => any) {}
    // dispatch<K extends keyof EntityEventType>(event: K, ...args: EntityEventType[K]) {
    //     if (event === "points-changed") {
    //         const a = args[0] as number[];
    //     }
    // }
}
