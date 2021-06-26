import { colorrefToCSSColor } from "stratum/common/colorrefParsers";
import { Constant } from "stratum/common/constant";
import { PenComponent } from "../components/penComponent";

export class PenCanvasComponent extends PenComponent {
    private _cssColor: string = "";
    private _strokeStyle: string | null = null;

    cssColor(): string {
        if (this.colorChanged) {
            this._cssColor = colorrefToCSSColor(this.color());
            this.colorChanged = false;
        }
        return this._cssColor;
    }

    strokeStyle(): string | null {
        if (this.styleChanged) {
            this._strokeStyle = this.style() === Constant.PS_NULL ? null : this.cssColor();
            this.styleChanged = false;
        }
        return this._strokeStyle;
    }
}
