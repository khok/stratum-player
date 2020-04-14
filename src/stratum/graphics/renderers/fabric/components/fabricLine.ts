import { fabric } from "fabric";
import { Point2D, VdrLayers } from "data-types-graphics";
import { LineElementVisual, LineVisualOptions } from "scene-types";
import { BrushToolState, PenToolState } from "vm-interfaces-graphics";
import { fabricConfigObjectOptions } from "../fabricConfig";

function getFillValue(brush?: BrushToolState) {
    if (!brush) return undefined;
    switch (brush.fillType) {
        case "SOLID":
            return brush.color;
        case "PATTERN":
            return brush.bmpTool && new fabric.Pattern({ source: brush.bmpTool.image });
        default:
            return undefined;
    }
}

export class FabricLine implements LineElementVisual {
    readonly type = "line";
    private posX: number;
    private posY: number;
    private visibleArea: Point2D;
    obj: fabric.Polyline;
    readonly handle: number;
    readonly selectable: boolean;
    private layerVisible = true;
    private options: number;

    constructor(
        { handle, points, position, options, isVisible, selectable, brush, pen }: LineVisualOptions,
        private viewRef: Point2D,
        private requestRedraw: () => void
    ) {
        this.options = options || 0;
        this.handle = handle;
        this.posX = position.x;
        this.posY = position.y;
        const opts: fabric.IPolylineOptions = {
            ...fabricConfigObjectOptions,
            left: position.x - viewRef.x,
            top: position.y - viewRef.y,
            fill: getFillValue(brush),
            stroke: pen && pen.color,
            strokeWidth: pen ? pen.width || 0.5 : 0,
            visible: isVisible,
        };

        this.selectable = selectable;
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
        this.obj.scaleToWidth(width);
        this.obj.scaleToHeight(height);
        this.requestRedraw();
    }

    setAngle(angle: number): void {
        this.obj.set({ angle }).setCoords();
        this.requestRedraw();
    }

    testIntersect(x: number, y: number) {
        const diffX = x - this.posX;
        const diffY = y - this.posY;
        return diffX > 0 && diffX <= this.visibleArea.x && diffY > 0 && diffY <= this.visibleArea.y;
    }

    applyLayers(layers: VdrLayers): void {
        this.layerVisible = this.options !== 6144 || !layers[3];
        this.show();
    }

    show(): void {
        this.obj.visible = this.layerVisible && true;
        this.requestRedraw();
    }

    hide(): void {
        this.obj.visible = false;
        this.requestRedraw();
    }

    updatePen(pen: PenToolState): void {
        this.obj.set({ strokeWidth: pen.width, stroke: pen.color });
        this.requestRedraw();
    }
    updateBrush(brush: BrushToolState): void {
        this.obj.fill = getFillValue(brush);
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
}
