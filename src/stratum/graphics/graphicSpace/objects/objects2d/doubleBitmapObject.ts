import { DoubleBitmapElementData } from "data-types-graphics";
import { DoubleBitmapElementVisual, VisualFactory } from "scene-types";
import { VmBool } from "vm-interfaces-base";
import { DoubleBitmapObjectState, GraphicSpaceToolsState } from "vm-interfaces-graphics";
import { DoubleBitmapTool } from "../../tools";
import { Object2dMixin } from "./object2dMixin";
import { StratumError } from "~/helpers/errors";

export class DoubleBitmapObject extends Object2dMixin implements DoubleBitmapObjectState {
    readonly type = "otDOUBLEBITMAP2D";
    private _doubleBitmapTool: DoubleBitmapTool | undefined;
    protected readonly _subclassInstance: this = this;
    visual: DoubleBitmapElementVisual;
    constructor(data: DoubleBitmapElementData, tools: GraphicSpaceToolsState, visualFactory: VisualFactory) {
        super(data);
        const doubleBitmapTool = tools.getTool<DoubleBitmapTool>("ttDOUBLEDIB2D", data.doubleDibHandle);
        if (!doubleBitmapTool) {
            //TODO: fix
            throw new StratumError(`Двойная битовая карта #${data.doubleDibHandle} не существует`);
        }
        this.visual = visualFactory.createDoubleBitmap({
            handle: data.handle,
            position: data.position,
            size: data.size,
            isVisible: !!this.isVisible,
            doubleBitmapTool
        });
        this.doubleBitmapTool = doubleBitmapTool;
    }
    setRect(x: number, y: number, width: number, height: number): VmBool {
        throw new Error("Method not implemented.");
    }

    get doubleBitmapTool() {
        return this._doubleBitmapTool;
    }
    set doubleBitmapTool(value) {
        if (this.doubleBitmapTool) this.doubleBitmapTool.unsubscribe(this);
        if (value) value.subscribe(this, b => this.visual.updateBitmap(b));
        this._doubleBitmapTool = value;
    }
    unsubFromTools() {
        if (this.doubleBitmapTool) this.doubleBitmapTool.unsubscribe(this);
    }
}
