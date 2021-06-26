import { GroupElement, LineElement, VectorDrawingElement } from "stratum/fileFormats/vdr";
import { BoundingBoxComponent } from "./components/boundingBoxComponent";
import { BrushComponent } from "./components/brushComponent";
import { GroupComponent } from "./components/groupComponent";
import { HierarchyComponent } from "./components/hierarchyComponent";
import { LayersComponent } from "./components/layersComponent";
import { LineComponent } from "./components/lineComponent";
import { MatrixComponent } from "./components/matrixComponent";
import { PenComponent } from "./components/penComponent";
import { SceneOffsetComponent } from "./components/sceneOffsetComponent";
import { SelectableComponent } from "./components/selectableComponent";
import { ToolKeeperComponent } from "./components/toolKeeperComponent";
import { TransformComponent } from "./components/transformComponent";
import { VisibilityComponent } from "./components/visibilityComponent";
import { Entity } from "./entity";
import { ToolManager } from "./toolManager";

export interface EntityFactoryArgs {
    matrix: MatrixComponent;
    layers: LayersComponent;
    tools: ToolManager;
    scene: SceneOffsetComponent;
}

export class EntityFactory {
    constructor(readonly args: EntityFactoryArgs) {}
    private entity(el: VectorDrawingElement, bbox: BoundingBoxComponent, hier: HierarchyComponent): Entity {
        const visible = true;
        const _selectable = !(el.options & 8);
        const layer = (el.options >> 8) & 0b11111;

        const { matrix, layers, scene } = this.args;
        const transform = new TransformComponent({ bbox, matrix, hier });
        const visib = new VisibilityComponent({ visible, layer, layers });
        const selectable = new SelectableComponent({ selectable: _selectable });

        return new Entity({
            handle: el.handle,
            name: el.name,
            hyperbase: el.hyperbase,
            bbox,
            hier,
            transform,
            visib,
            selectable,
            sceneOffset: scene,
        });
    }
    line(args: LineElement): Entity {
        const { tools, matrix } = this.args;

        const bbox = new LineComponent({ coords: args.coords, matrix });
        const hier = new HierarchyComponent({ bbox });
        const entity = this.entity(args, bbox, hier);

        entity.line = bbox;
        entity.penKeeper = new ToolKeeperComponent<PenComponent>(tools.pen(args.penHandle));
        entity.brushKeeper = new ToolKeeperComponent<BrushComponent>(tools.brush(args.brushHandle));
        return entity;
    }
    group(args: GroupElement): Entity {
        const bbox = new GroupComponent();
        const entity = this.entity(args, bbox, bbox.hier);
        entity.group = bbox;
        return entity;
    }

    instantiate(elements: VectorDrawingElement[]): Map<number, Entity> {
        const groups: [GroupComponent, number[]][] = [];

        const data = elements.map<[number, Entity]>((el) => {
            switch (el.type) {
                case "line":
                    return [el.handle, this.line(el)];
                case "group":
                    const g = this.group(el);
                    if (!g.group) throw Error();
                    groups.push([g.group, el.childHandles]);
                    return [el.handle, g];
                default:
                    return [0, new Entity()];
            }
        });

        const map = new Map(data);

        groups.forEach(([g, handles]) => {
            handles.forEach((h) => map.get(h)?.hier.setParent(g));
            g.onChildrenChanged();
        });

        return map;
    }
}
