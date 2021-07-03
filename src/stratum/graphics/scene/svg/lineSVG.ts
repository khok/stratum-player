import { LineElement2D, LineElement2DArgs } from "../elements/lineElement2d";
import { Scene } from "../scene";
import { BrushSVG } from "./brushSVG";
import { PenSVG } from "./penSVG";

export class LineSVG extends LineElement2D {
    _svg: SVGPolygonElement = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    private prevOx = 0;
    private prevOy = 0;
    private prevVisible = false;
    private prevPenVer = -1;
    private prevBrushVer = -1;
    private prevShapeVer = -1;

    constructor(scene: Scene, coords: readonly number[], args: LineElement2DArgs = {}) {
        super(scene, coords, args);
        this._svg.setAttribute("fill-rule", "evenodd");
        this._svg.setAttribute("stroke-linecap", "round");
        // this.cnv = document.createElement("canvas");
        // this.localCtx = this.cnv.getContext("2d", { alpha: true })!;
    }
    // private static drawFigure(
    //     ctx: CanvasRenderingContext2D,
    //     ox: number,
    //     oy: number,
    //     coords: number[],
    //     brush: string | CanvasPattern | null,
    //     pen: string | null,
    //     penWidth: number
    // ) {
    //     ctx.beginPath();
    //     ctx.moveTo(coords[0] + ox + penWidth, coords[1] + oy + penWidth);
    //     for (let i = 2; i < coords.length; i += 2) {
    //         ctx.lineTo(coords[i] + ox + penWidth, coords[i + 1] + oy + penWidth);
    //     }
    //     if (brush) {
    //         ctx.closePath();
    //         ctx.fillStyle = brush;
    //         ctx.fill("evenodd");
    //     }
    //     if (pen) {
    //         ctx.lineWidth = penWidth;
    //         ctx.lineCap = "round";
    //         ctx.strokeStyle = pen;
    //         ctx.stroke();
    //     }
    // }

    render(sceneX: number, sceneY: number) {
        const visible = this.visib.visible();

        if (this.prevVisible !== visible) {
            this.prevVisible = visible;
            if (visible) {
                this._svg.removeAttribute("display");
            } else {
                this._svg.setAttribute("display", "none");
            }
        }

        if (!visible) return;

        let toolChanged = false;
        const brushTool = this.brush._tool as BrushSVG;
        const penTool = this.pen._tool as PenSVG;

        if (this.pen.ver !== this.prevPenVer) {
            this.prevPenVer = this.pen.ver;
            toolChanged = true;
            if (penTool) {
                const pw = penTool.width() || 1;
                this._svg.setAttribute("stroke-width", pw.toString());
                const stroke = penTool.strokeStyle();
                this._svg.setAttribute("stroke", stroke);
            } else {
                this._svg.removeAttribute("stroke");
            }
        }

        if (this.brush.ver !== this.prevBrushVer) {
            this.prevBrushVer = this.brush.ver;
            toolChanged = true;
            if (brushTool) {
                if (this._coords.length > 4) {
                    const fill = brushTool.fillStyle();
                    this._svg.setAttribute("fill", fill);
                } else {
                    this._svg.removeAttribute("fill");
                }
            } else {
                this._svg.setAttribute("fill", "none");
            }
        }

        if (toolChanged) {
            if (!brushTool && !penTool) {
                this._svg.setAttribute("display", "none");
                return;
            } else {
                this._svg.removeAttribute("display");
            }
        }

        if (this._shapeVer !== this.prevShapeVer) {
            this.prevShapeVer = this._shapeVer;
            let str = "";
            for (let i = 0; i < this._coords.length; i += 2) {
                str += this._coords[i] + "," + this._coords[i + 1] + " ";
            }
            this._svg.setAttribute("points", str);
        }

        const ox = this._x - sceneX;
        const oy = this._y - sceneY;

        if (ox !== this.prevOx || oy !== this.prevOy) {
            this.prevOx = ox;
            this.prevOy = oy;
            this._svg.setAttribute("transform", `translate(${ox}, ${oy})`);
        }
    }

    // isPointOver(p: SVGPoint): boolean {
    //     return !!((this.pen._tool && this._svg.isPointInFill(p)) || (this.brush._tool && this._svg.isPointInStroke(p)));
    // }
}
// penHandle(): number {
//     return this.pen ? this.pen.handle : 0;
// }
// brushHandle(): number {
//     return this.brush ? this.brush.handle : 0;
// }

// // scene
// delete(): void {
//     this.pen?.unsubscribe(this);
//     this.brush?.unsubscribe(this);
//     this._parent?.removeChild(this);
//     this.markDeleted = true;
//     this.scene.dirty = true;
// }

// getChildByName(name: string): number {
//     return this.name === name ? this.handle : 0;
// }

// minX(): number {
//     return this._x;
// }
// minY(): number {
//     return this._y;
// }
// maxX(): number {
//     return this._x + this._width;
// }
// maxY(): number {
//     return this._y + this._height;
// }
// onParentChanged(parent: SceneGroup | null) {
//     if (parent === this._parent) return;
//     this._parent?.removeChild(this);
//     this._parent = parent;
// }

// render(ctx: CanvasRenderingContext2D, sceneX: number, sceneY: number, layers: number) {
//     if (!this._visible || (this._layer & layers) !== 0) return;
//     const pw = this.pen ? this.pen.width() || 1 : 0;
//     const ox = this._x - sceneX - pw;
//     const oy = this._y - sceneY - pw;

//     const brush = (this.coords.length > 4 && this.brush?.fillStyle(ctx)) || null;
//     const pen = this.pen?.strokeStyle() || null;
//     if (!brush && !pen) {
//         return;
//     }

//     if (this._width * this._height > 4194304) {
//         this._selectable = 0;
//         SceneLine.drawFigure(ctx, ox, oy, this.coords, brush, pen, pw);
//         return;
//     }
//     if (this.needRedraw) {
//         this.cnv.width = Math.max(this._width + pw * 2, 1);
//         this.cnv.height = Math.max(this._height + pw * 2, 1);
//         SceneLine.drawFigure(this.ctx2, 0, 0, this.coords, brush, pen, pw);
//         this.needRedraw = false;
//     }
//     const oper = this.brush?.compositeOperation() ?? "source-over";
//     if (oper === "source-over") {
//         ctx.drawImage(this.cnv, ox, oy);
//     } else {
//         ctx.globalCompositeOperation = oper;
//         ctx.drawImage(this.cnv, ox, oy);
//         ctx.globalCompositeOperation = "source-over";
//     }
// }

// private pointOnLine(ox: number, oy: number, pw: number): boolean {
//     for (let i = 0; i < this.coords.length - 2; i += 2) {
//         const x1 = this.coords[i];
//         const y1 = this.coords[i + 1];
//         const x2 = this.coords[i + 2];
//         const y2 = this.coords[i + 3];
//         const len = Math.hypot(x2 - x1, y2 - y1);
//         const d1 = Math.hypot(ox - x1, oy - y1);
//         const d2 = Math.hypot(ox - x2, oy - y2);

//         const diff = d1 + d2 - len;
//         if (diff <= pw) return true;
//     }
//     return false;
// }

// tryClick(x: number, y: number, layers: number): this | SceneGroup | undefined {
//     if (!this._visible || (this._layer & layers) !== 0 || this._selectable === 0) return undefined;

//     const pw = this.pen ? this.pen.width() || 1 : 0;
//     const ox = x - this._x;
//     const oy = y - this._y;
//     if (ox < -pw || oy < -pw || ox > this._width + pw || oy > this._height + pw) return undefined;

//     // if (!this.brush) {
//     //     if (!this.pointOnLine(ox, oy, pw)) return undefined;
//     // } else if (this.ctx2.getImageData(ox, oy, 1, 1).data[3] === 0) return undefined;

//     return this._parent ? this._parent.root() : this;
// }

// toolChanged() {
//     this.needRedraw = true;
//     this.scene.dirty = true;
// }
