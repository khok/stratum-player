import { BitmapElementData } from "data-types-graphics";
import { BitmapElementVisual, VisualFactory } from "scene-types";
import { VmBool } from "vm-interfaces-base";
import { BitmapObjectState, GraphicSpaceToolsState } from "vm-interfaces-graphics";
import { BitmapTool } from "../../tools";
import { Object2dMixin } from "./object2dMixin";
import { StratumError } from "~/helpers/errors";

export class BitmapObject extends Object2dMixin implements BitmapObjectState {
    readonly type = "otBITMAP2D";
    private _bmpTool: BitmapTool | undefined;
    protected readonly _subclassInstance: this = this;
    visual: BitmapElementVisual;
    constructor(data: BitmapElementData, tools: GraphicSpaceToolsState, visualFactory: VisualFactory) {
        super(data);
        const bmpTool = tools.getTool<BitmapTool>("ttDIB2D", data.dibHandle);
        if (!bmpTool) {
            //TODO: fix
            throw new StratumError(`Битовая карта #${data.dibHandle} не существует`);
        }
        this.visual = visualFactory.createBitmap({
            handle: data.handle,
            position: data.position,
            size: data.size,
            isVisible: !!this.isVisible,
            bmpOrigin: data.bmpOrigin,
            bmpiSize: data.bmpSize,
            bitmapTool: bmpTool
        });
        this.bmpTool = bmpTool;
    }
    setRect(x: number, y: number, width: number, height: number): VmBool {
        throw new Error("Method not implemented.");
    }

    get bmpTool() {
        return this._bmpTool;
    }
    set bmpTool(value) {
        if (this.bmpTool) this.bmpTool.unsubscribe(this);
        if (value) value.subscribe(this, b => this.visual.updateBitmap(b));
        this._bmpTool = value;
    }
    unsubFromTools() {
        if (this.bmpTool) this.bmpTool.unsubscribe(this);
    }
}
