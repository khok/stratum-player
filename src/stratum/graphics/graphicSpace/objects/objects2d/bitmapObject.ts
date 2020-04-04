import { BitmapElementData } from "data-types-graphics";
import { BitmapElementVisual, VisualFactory } from "scene-types";
import { VmBool } from "vm-interfaces-base";
import { BitmapObjectState, GraphicSpaceToolsState } from "vm-interfaces-graphics";
import { BitmapTool } from "../../tools";
import { Object2dMixin } from "./object2dMixin";
import { StratumError } from "~/helpers/errors";

export class BitmapObject extends Object2dMixin implements BitmapObjectState {
    readonly type = "otBITMAP2D";
    private _bmpTool: BitmapTool;
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
            selectable: !!this.selectable,
            bmpOrigin: data.bmpOrigin,
            bmpSize: data.bmpSize,
            bitmapTool: bmpTool,
        });
        bmpTool.subscribe(this, () => this.visual.updateBitmap(bmpTool));
        this._bmpTool = bmpTool;
    }
    setRect(x: number, y: number, width: number, height: number): VmBool {
        this.visual.setRect(x, y, width, height);
        return 1;
    }

    get bmpTool() {
        return this._bmpTool;
    }
    set bmpTool(value) {
        this.bmpTool.unsubscribe(this);
        value.subscribe(this, () => this.visual.updateBitmap(value));
        this._bmpTool = value;
    }
    protected unsubFromTools() {
        if (this.bmpTool) this.bmpTool.unsubscribe(this);
    }
}
