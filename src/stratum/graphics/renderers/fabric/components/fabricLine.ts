import { fabric } from "fabric";
import { colorRefToColor } from "stratum/common/colorrefParsers";
import { RenderableLine, RenderableLineParams } from "stratum/graphics/scene/interfaces";
import { SceneBrushTool, ScenePenTool } from "stratum/graphics/scene/tools";
import { Point2D } from "stratum/helpers/types";
import { objectOptions } from "../fabricConfig";

function getFillValue(brush?: SceneBrushTool) {
    if (!brush) return undefined;
    switch (brush.fillType) {
        case "SOLID":
            return colorRefToColor(brush.color);
        case "PATTERN":
            const bmp = brush.bmpTool;
            return bmp && bmp.image ? new fabric.Pattern({ source: bmp.image }) : "white";
        default:
            return undefined;
    }
}

export class FabricLine implements RenderableLine {
    readonly type = "line";
    private posX: number;
    private posY: number;
    private visibleArea: Point2D;
    obj: fabric.Polyline;
    readonly handle: number;
    readonly selectable: boolean;

    constructor(
        { handle, points, position, isVisible, selectable, brush, pen }: RenderableLineParams,
        private viewRef: Point2D,
        private requestRedraw: () => void
    ) {
        this.handle = handle;
        this.posX = position.x;
        this.posY = position.y;
        const opts: fabric.IPolylineOptions = {
            ...objectOptions,
            left: position.x - viewRef.x,
            top: position.y - viewRef.y,
            fill: getFillValue(brush),
            stroke: pen && pen.style !== "NULL" ? colorRefToColor(pen.color) : undefined,
            strokeWidth: pen ? pen.width || 0.5 : 0,
            visible: isVisible,
        };

        //костыль для прозрачных объектов
        this.selectable = brush ? selectable : false;
        // this.selectable = selectable;
        this.obj = new fabric.Polyline(points, opts);
        this.visibleArea = FabricLine.calcSize(points).size;
        // this.visibleArea = { x: this.obj.width || 0, y: this.obj.height || 0 };
    }

    private static calcSize(points: Point2D[]) {
        //prettier-ignore
        const sizes = points.length > 0 ? points.reduce(
            (a, c) => ({
                minX: Math.min(a.minX, c.x),
                maxX: Math.max(a.maxX, c.x),
                minY: Math.min(a.minY, c.y),
                maxY: Math.max(a.maxY, c.y)
            }),
            { minX: points[0].x, maxX: points[0].x, minY: points[0].y, maxY: points[0].y }
        ) : { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        return {
            position: { x: sizes.minX, y: sizes.minY },
            size: { x: sizes.maxX - sizes.minX, y: sizes.maxY - sizes.minY },
        };
    }

    getVisibleAreaSize(): Point2D {
        return this.visibleArea;
    }

    updateAfterViewTranslate() {
        const { posX, posY, viewRef } = this;
        this.obj.set({ left: posX - viewRef.x, top: posY - viewRef.y }).setCoords();
    }

    setPosition(x: number, y: number): void {
        const { x: viewX, y: viewY } = this.viewRef;
        this.obj.set({ left: x - viewX, top: y - viewY }).setCoords();
        this.posX = x;
        this.posY = y;
        this.requestRedraw();
    }

    scaleTo(width: number, height: number): void {
        this.visibleArea = { x: width, y: height };
        this.obj.set({ scaleX: width / this.obj.width!, scaleY: height / this.obj.height! }).setCoords();
        // this.obj.scaleToWidth(width, true).setCoords();
        // this.obj.scaleToHeight(height, true).setCoords();
        this.requestRedraw();
    }

    setAngle(angle: number): void {
        this.obj.set({ angle }).setCoords();
        this.requestRedraw();
    }

    hasPoint(x: number, y: number) {
        const diffX = x - this.posX;
        const diffY = y - this.posY;
        return diffX > 0 && diffX <= this.visibleArea.x && diffY > 0 && diffY <= this.visibleArea.y;
    }

    testIntersect(x: number, y: number) {
        if (!this.obj.visible) return false;
        const diffX = x - this.posX;
        const diffY = y - this.posY;
        return diffX > 0 && diffX <= this.visibleArea.x && diffY > 0 && diffY <= this.visibleArea.y;
    }

    show(): void {
        this.obj.set({ visible: true });
        this.requestRedraw();
    }

    hide(): void {
        this.obj.set({ visible: false });
        this.requestRedraw();
    }

    updatePen(pen: ScenePenTool): void {
        this.obj.set({ strokeWidth: pen.width, stroke: colorRefToColor(pen.color) });
        this.requestRedraw();
    }
    updateBrush(brush: SceneBrushTool): void {
        this.obj.set({ fill: getFillValue(brush) });
        this.requestRedraw();
    }

    setPointPosition(index: number, x: number, y: number): void {
        this.obj.points![index] = new fabric.Point(x, y);
        this.obj.set({ dirty: true, objectCaching: false }).setCoords();
        const { size, position } = FabricLine.calcSize(this.obj.points!);
        // .set({ points: points.map((p) => new fabric.Point(p.x, p.y)), dirty: true, objectCaching: false })
        // .setCoords();
        // this.obj._calcDimensions();
        this.visibleArea = size;
        this.requestRedraw();
    }

    addPoint(index: number, x: number, y: number) {
        if (index < 0) {
            this.obj.points!.push(new fabric.Point(x, y));
        } else {
            this.obj.points!.splice(index, 0, new fabric.Point(x, y));
        }
        this.obj.set({ dirty: true, objectCaching: false }).setCoords();
        const { size, position } = FabricLine.calcSize(this.obj.points!);
        this.visibleArea = size;
        this.requestRedraw();
    }
}
