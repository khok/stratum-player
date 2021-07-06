import { LineElement2D, LineElement2DArgs } from "../elements/lineElement2d";
import { Scene } from "../scene";
import { BrushSVG } from "./brushSVG";
import { PenSVG } from "./penSVG";

export class LineSVG extends LineElement2D {
    _svg: SVGPolylineElement = document.createElementNS("http://www.w3.org/2000/svg", "polyline");

    private prevVisible = true;
    private prevOx = 0;
    private prevOy = 0;

    private prevPenVer = -1;
    private prevBrushVer = -1;
    private prevShapeVer = -1;

    constructor(scene: Scene, coords: readonly number[], args: LineElement2DArgs = {}) {
        super(scene, coords, args);
        this._svg.setAttribute("fill-rule", "evenodd");
        this._svg.setAttribute("stroke-linecap", "round");
    }

    render(): void {
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
        const brushTool = this.brush._tool as BrushSVG | null;
        const penTool = this.pen._tool as PenSVG | null;

        if (this.pen._ver !== this.prevPenVer) {
            this.prevPenVer = this.pen._ver;
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

        if (this.brush._ver !== this.prevBrushVer) {
            this.prevBrushVer = this.brush._ver;
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

        const ox = this._x - this.scene._offsetX;
        const oy = this._y - this.scene._offsetY;

        if (ox !== this.prevOx || oy !== this.prevOy) {
            this.prevOx = ox;
            this.prevOy = oy;
            this._svg.setAttribute("transform", `translate(${ox}, ${oy})`);
        }
    }
}
