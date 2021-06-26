import { Hyperbase } from "stratum/fileFormats/vdr";
import { BoundingBoxComponent } from "./components/boundingBoxComponent";
import { BrushComponent } from "./components/brushComponent";
import { ClickableComponent } from "./components/clickableComponent";
import { GroupComponent } from "./components/groupComponent";
import { HierarchyComponent } from "./components/hierarchyComponent";
import { LineComponent } from "./components/lineComponent";
import { PenComponent } from "./components/penComponent";
import { SceneOffsetComponent } from "./components/sceneOffsetComponent";
import { SelectableComponent } from "./components/selectableComponent";
import { ToolKeeperComponent } from "./components/toolKeeperComponent";
import { TransformComponent } from "./components/transformComponent";
import { VisibilityComponent } from "./components/visibilityComponent";

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
    hyperbase?: Hyperbase;
    // bbox: LineComponent | GroupComponent;
    hier: HierarchyComponent;
    bbox: BoundingBoxComponent;
    transform: TransformComponent;
    // bbox: BoundingBoxComponent;
    visib: VisibilityComponent;
    selectable: SelectableComponent;
    sceneOffset: SceneOffsetComponent;
}

export class Entity {
    // export interface EntityEventType {
    //     moved: [dx: number, dy: number];
    //     rotated: [ox: number, oy: number, angle: number];
    //     scaled: [ox: number, oy: number, dx: number, dy: number];
    //     "bounding-box-changed": [minX: number, minY: number, maxX: number, maxY: number];
    //     "points-changed": [coords: number[], index?: number];
    // }

    readonly visibility: VisibilityComponent;
    // private _matrix: MatrixComponent;
    readonly bbox: BoundingBoxComponent;
    readonly transform: TransformComponent;
    readonly hier: HierarchyComponent;
    readonly selectable: SelectableComponent;
    readonly sceneOffset: SceneOffsetComponent;

    clickable: ClickableComponent | null = null;

    line: LineComponent | null = null;
    group: GroupComponent | null = null;
    text: unknown | null = null;
    penKeeper: ToolKeeperComponent<PenComponent> | null = null;
    brushKeeper: ToolKeeperComponent<BrushComponent> | null = null;

    handle: number;
    name: string;
    hyperbase: Hyperbase | null;
    markDeleted: boolean = false;

    constructor({ handle, name, hyperbase, bbox, hier, transform, visib, selectable, sceneOffset }: EntityArgs) {
        // let bbox: BoundingBoxComponent;
        // if (line) {
        //     this._line = line;
        //     bbox = line;
        // } else {
        //     throw Error();
        // }
        this.visibility = visib;
        this.transform = transform;
        this.hier = hier;
        this.selectable = selectable;
        this.sceneOffset = sceneOffset;
        // this._matrix = matrix;
        this.bbox = bbox;
        this.handle = handle;
        this.name = name ?? "";
        this.hyperbase = hyperbase ?? null;
    }
    // bbox(): BoundingBoxComponent {
    //     return this._bbox;
    // }
    // transform(): TransformComponent {
    //     return this._transform;
    // }
    // hier(): HierarchyComponent {
    //     return this._hier;
    // }
    // visibility(): VisibilityComponent {
    //     return this.visib;
    // }
    // selectable(): SelectableComponent {
    //     return this._selectable;
    // }

    // line(): LineComponent | null {
    //     return this._line;
    // }
    // penKeeper(): ToolKeeperComponent<PenComponent> | null {
    //     return this._penKeeper;
    // }
    // brushKeeper(): ToolKeeperComponent<BrushComponent> | null {
    //     return this._brushKeeper;
    // }

    // on<K extends keyof EntityEventType>(event: K, receiver: (...args: EntityEventType[K]) => any) {}
    // dispatch<K extends keyof EntityEventType>(event: K, ...args: EntityEventType[K]) {
    //     if (event === "points-changed") {
    //         const a = args[0] as number[];
    //     }
    // }
}
