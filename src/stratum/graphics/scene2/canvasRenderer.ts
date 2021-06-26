import { LineCanvasComponent } from "./canvasComponents/lineCanvasComponent";
import { Renderable } from "./canvasComponents/renderable";
import { BrushComponent } from "./components/brushComponent";
import { PenComponent } from "./components/penComponent";
import { ToolKeeperComponent } from "./components/toolKeeperComponent";
import { Entity } from "./entity";

export class CanvasRenderer {
    private objects: Renderable[] = [];
    constructor(readonly ctx: CanvasRenderingContext2D) {}

    private static pk(entity: Entity): ToolKeeperComponent<PenComponent> {
        if (!entity.penKeeper) throw Error("Сущность не имеет компонента ToolKeeperComponent<PenComponent>");
        return entity.penKeeper;
    }
    private static bk(entity: Entity): ToolKeeperComponent<BrushComponent> {
        if (!entity.brushKeeper) throw Error("Сущность не имеет компонента ToolKeeperComponent<BrushComponent>");
        return entity.brushKeeper;
    }

    add(entity: Entity): void {
        if (entity.line) {
            const penKeeper = CanvasRenderer.pk(entity);
            const brushKeeper = CanvasRenderer.bk(entity);

            const scene = entity.sceneOffset;

            const line = new LineCanvasComponent({ line: entity.line, brushKeeper, penKeeper, selectable: entity.selectable, visib: entity.visibility, scene });
            entity.clickable = line;
            this.objects.push(line);
        }
    }

    render(): void {
        this.objects.forEach((r) => r.render(this.ctx));
    }
}
