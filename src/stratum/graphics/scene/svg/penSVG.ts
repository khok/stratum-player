import { colorrefToCSSColor } from "stratum/common/colorrefParsers";
import { PenTool } from "../tools/penTool";

const PS_NULL = 5;

export class PenSVG extends PenTool {
    private _cssColor: string = "";
    private _prevColorVer: number = -1;

    cssColor(): string {
        if (this._prevColorVer !== this._colorVer) {
            this._prevColorVer = this._colorVer;
            this._cssColor = colorrefToCSSColor(this.color());
        }
        return this._cssColor;
    }

    strokeStyle(): string {
        return this._style === PS_NULL ? "transparent" : this.cssColor();
    }
}
