import { colorrefToCSSColor } from "stratum/common/colorrefParsers";
import { PenTool } from "../tools/penTool";

const PS_NULL = 5;

export class PenSVG extends PenTool {
    private _prevColor: number = 0;
    private _cssColor: string = colorrefToCSSColor(this._prevColor);

    cssColor(): string {
        if (this._prevColor !== this._color) {
            this._prevColor = this._color;
            this._cssColor = colorrefToCSSColor(this._color);
        }
        return this._cssColor;
    }

    strokeStyle(): string {
        return this._style === PS_NULL ? "transparent" : this.cssColor();
    }
}
