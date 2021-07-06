import { colorrefToCSSColor } from "stratum/common/colorrefParsers";
import { TextToolPartTool } from "../tools/textToolPartTool";
import { FontSVG } from "./fontSVG";

export class TSpanSVG {
    _svg: SVGTSpanElement = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    _prevFontVer = -1;
    _prevText = "";
    _prevFg = -1;
    _prevBg = -1;

    constructor(readonly part: TextToolPartTool) {
        this._svg.setAttribute("dominant-baseline", "text-before-edge"); //фуррифокс
        this._svg.setAttribute("alignment-baseline", "text-before-edge");
        // this._svg.setAttribute("letter-spacing", "-0.2");
        this._svg.style.setProperty("user-select", "none");
    }

    render(): boolean {
        let shapeChanged = false;
        const part = this.part;
        const text = part.str._tool.text();
        if (this._prevText !== text) {
            this._prevText = text;
            this._svg.innerHTML = text;
            shapeChanged = true;
        }

        if (this._prevFontVer !== part.font._ver) {
            this._prevFontVer = part.font._ver;
            const f = part.font._tool as FontSVG;
            this._svg.setAttribute("font-family", f.fname());
            this._svg.setAttribute("font-size", f.size().toString());
            this._svg.setAttribute("font-style", f.fstyle());
            this._svg.setAttribute("text-decoration", f.tdecoration());
            this._svg.setAttribute("font-weight", f.fweight());
            shapeChanged = true;
        }

        const fg = this.part.fgColor();
        if (this._prevFg !== fg) {
            this._prevFg = fg;
            this._svg.setAttribute("fill", colorrefToCSSColor(fg));
        }

        const bg = this.part.bgColor();
        if (this._prevBg !== bg) {
            this._prevBg = bg;
        }
        return shapeChanged;
    }
}
