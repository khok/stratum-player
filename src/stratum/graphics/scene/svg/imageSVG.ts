import { ImageElement2D, ImageElement2DArgs } from "../elements/imageElement2d";
import { Scene } from "../scene";
import { ImageTool } from "../tools/imageTool";

export class ImageSVG extends ImageElement2D {
    _svg: SVGSVGElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    private img: SVGImageElement;

    private prevVisible = true;
    private prevOx = 0;
    private prevOy = 0;
    private prevWidth = 0;
    private prevHeight = 0;

    private prevImageVer = -1;
    private prevCropVer = -1;

    constructor(scene: Scene, isTransparent: boolean, tool: ImageTool, args: ImageElement2DArgs = {}) {
        super(scene, isTransparent, tool, args);
        this._svg.setAttribute("preserveAspectRatio", "none");
        this._svg.appendChild((this.img = document.createElementNS("http://www.w3.org/2000/svg", "image")));
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

        const imgTool = this.image._tool;
        if (this.image._ver !== this.prevImageVer) {
            this.prevImageVer = this.image._ver;
            const i = imgTool.img();
            if (i) this.img.setAttribute("href", i.canvas.toDataURL());
            // this._svg.setAttribute("href", "./data/icons/VARPOINT.BMP");
        }

        if (this._cropVer !== this.prevCropVer) {
            this.prevCropVer = this._cropVer;
            const c = this._crop;
            if (c) {
                this._svg.setAttribute("viewBox", `${c.x} ${c.y} ${c.w} ${c.h}`);
            } else {
                this._svg.setAttribute("viewBox", `0 0 ${imgTool.width()} ${imgTool.height()}`);
            }
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
    }
}
