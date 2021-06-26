import { colorrefToCSSColor } from "stratum/common/colorrefParsers";
import { Constant } from "stratum/common/constant";
import { BrushComponent } from "../components/brushComponent";

export class BrushCanvasComponent extends BrushComponent {
    private compOp: string = "";
    private _cssColor: string = "";
    private _fillStyle: string | CanvasPattern | null = null;

    cssColor(): string {
        if (this.colorChanged) {
            this._cssColor = colorrefToCSSColor(this.color());
            this.colorChanged = false;
        }
        return this._cssColor;
    }

    compositeOperation(): string {
        if (this.ropChanged) {
            switch (this.rop()) {
                case Constant.R2_MASKPEN:
                    this.compOp = "multiply";
                    break;
                case Constant.R2_NOTXORPEN:
                    this.compOp = "multiply";
                    break;
                default:
                    this.compOp = "source-over";
                    break;
            }
            this.ropChanged = false;
        }
        return this.compOp;
    }

    fillStyle(ctx: CanvasRenderingContext2D): string | CanvasPattern | null {
        if (this.styleChanged) {
            switch (this.style()) {
                case Constant.BS_SOLID:
                    this._fillStyle = this.cssColor();
                    break;
                case Constant.BS_NULL:
                    this._fillStyle = null;
                    break;
                case Constant.BS_PATTERN:
                    // this._fillStyle = this.dibTool()?.pattern(ctx) ?? "white";
                    this._fillStyle = "black";
                    break;
                default:
                    this._fillStyle = "white";
            }
            this.styleChanged = false;
        }
        return this._fillStyle;
    }
}
