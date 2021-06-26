import { VectorDrawingElement, VectorDrawingTools } from "stratum/fileFormats/vdr";
import { LayersComponent } from "./components/layersComponent";
import { MatrixComponent } from "./components/matrixComponent";
import { SceneOffsetComponent } from "./components/sceneOffsetComponent";
import { Entity } from "./entity";
import { EntityFactory } from "./entityFactory";
import { ToolFactory } from "./toolFactory";
import { ToolManager } from "./toolManager";

export interface EntityManagerArgs {
    ox: number;
    oy: number;
    layers: number;
    tools: VectorDrawingTools;
    matrix?: number[];
    elements?: VectorDrawingElement[];
    factory: ToolFactory;
}

export class EntityManager {
    tools: ToolManager;
    entities: Map<number, Entity>;
    offset: SceneOffsetComponent;
    layers: LayersComponent;
    matrix: MatrixComponent;

    constructor({ factory, ox, oy, layers, matrix, elements, tools }: EntityManagerArgs) {
        this.offset = new SceneOffsetComponent(ox, oy);
        this.layers = new LayersComponent(layers);
        this.matrix = new MatrixComponent(matrix);
        this.tools = new ToolManager(factory, tools);

        const ef = new EntityFactory({ tools: this.tools, layers: this.layers, matrix: this.matrix, scene: this.offset });

        this.entities = elements ? ef.instantiate(elements) : new Map();
    }
}
