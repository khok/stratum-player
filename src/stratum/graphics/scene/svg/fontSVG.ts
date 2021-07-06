import { FontTool } from "../tools/fontTool";

export class FontSVG extends FontTool {
    // this._style = (italic ? 1 : 0) | (underline ? 2 : 0) | (strikeOut ? 4 : 0) | (weight ? 8 : 0);
    // this._cssName = fontName.toUpperCase().endsWith(" CYR") ? fontName.slice(0, fontName.length - 4) : fontName;
    // this._size *= this._size < 0 ? -1 : 1;
    // this._cssName = fontName.endsWith(" CYR") ? fontName.slice(0, fontName.length - 4) : fontName;

    private _prevName = "";
    private _realName: string = "";

    fstyle(): string {
        return this._style & 1 ? "italic" : "normal";
    }

    tdecoration(): string {
        const underline = this._style & 2 ? "underline" : "";
        const strike = this._style & 4 ? "line-through" : "";
        return underline + " " + strike;
    }

    fweight(): string {
        return this._style & 8 ? "bold" : "normal";
    }

    fname(): string {
        const nm = this._name;
        if (this._prevName !== nm) {
            this._prevName = nm;
            this._realName = nm.toUpperCase().endsWith(" CYR") ? nm.slice(0, nm.length - 4) : nm;
        }
        return this._realName;
    }

    // toCSSString() {
    //     return `${this._style & 8 ? "bold" : ""} ${this._style & 1 ? "italic" : ""} ${this._size}px ${this._cssName}`;
    // }
}
