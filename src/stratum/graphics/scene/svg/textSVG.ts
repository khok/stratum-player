import { TextElement2D, TextElement2DArgs } from "../elements/textElement2d";
import { Scene } from "../scene";
import { TextTool } from "../tools/textTool";
import { RendererSVG } from "./rendererSVG";
import { TSpanSVG } from "./tspanSVG";

export class TextSVG extends TextElement2D {
    _svg: SVGTextElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    private spans: TSpanSVG[];

    private prevVisible = true;
    private prevOx = 0;
    private prevOy = 0;
    private prevWidth = 0;
    private prevHeight = 0;
    private prevAngle = 0;

    private bbox: DOMRect | null = null;

    constructor(scene: Scene, tool: TextTool, args: TextElement2DArgs = {}) {
        super(scene, tool, args);
        const frag = document.createDocumentFragment();
        this.spans = tool.parts.map<TSpanSVG>((part) => {
            const span = new TSpanSVG(part);
            frag.appendChild(span._svg);
            return span;
        });
        this._svg.appendChild(frag);
    }

    private getBbox(): DOMRect {
        if (!this.bbox) {
            const p = this._svg.parentElement;
            if (!p) {
                (this.scene as RendererSVG).root.appendChild(this._svg);
                this.render();
            }
            this.bbox = this._svg.getBBox();
            if (!p) {
                this._svg.remove();
            }
        }
        return this.bbox;
    }

    actualWidth(): number {
        return this.getBbox().width;
    }

    actualHeight(): number {
        return this.getBbox().height;
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

        let shapeChanged = false;
        this.spans.forEach((s) => (shapeChanged = shapeChanged || s.render()));
        if (shapeChanged) {
            this.bbox = null;
        }

        const ox = this._x - this.scene._offsetX;
        if (ox !== this.prevOx) {
            this.prevOx = ox;
            this._svg.setAttribute("x", ox.toString());
        }
        const oy = this._y - this.scene._offsetY;
        if (oy !== this.prevOy) {
            this.prevOy = oy;
            this._svg.setAttribute("y", oy.toString());
        }
        const w = this._width;
        if (this.prevWidth !== w) {
            this.prevWidth = w;
            this._svg.setAttribute("width", w.toString());
        }
        const h = this._height;
        if (this.prevHeight !== h) {
            this.prevHeight = h;
            this._svg.setAttribute("height", h.toString());
        }
        const a = this._angle;
        if (this.prevAngle !== a) {
            this.prevAngle = a;
            this._svg.setAttribute("transform", `rotate(${(a * 180) / Math.PI}, ${ox}, ${oy})`);
        }
    }
}
