import { colorrefToCSSColor } from "stratum/common/colorrefParsers";
import { BrushTool } from "../tools/brushTool";

const R2_MASKPEN = 9;
const R2_NOTXORPEN = 10;
const BS_SOLID = 0;
const BS_NULL = 1;
// const BS_HATCHED = 2;
const BS_PATTERN = 3;

export class BrushSVG extends BrushTool {
    private _cssColor: string = "";
    private _prevColorVer: number = -1;

    cssColor(): string {
        if (this._prevColorVer !== this._colorVer) {
            this._prevColorVer = this._colorVer;
            this._cssColor = colorrefToCSSColor(this.color());
        }
        return this._cssColor;
    }

    compositeOperation(): string {
        switch (this._rop) {
            case R2_MASKPEN:
                return "multiply";
            case R2_NOTXORPEN:
                return "multiply";
            default:
                return "source-over";
        }
    }

    fillStyle(): string {
        switch (this._style) {
            case BS_SOLID:
                return this.cssColor();
            case BS_NULL:
                return "transparent";
            case BS_PATTERN:
                // return this.dibTool()?.pattern(ctx) ?? "white";
                return "black";
            default:
                return "white";
        }
    }
}
