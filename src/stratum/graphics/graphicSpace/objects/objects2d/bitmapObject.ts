import { BitmapElementData, DoubleBitmapElementData } from "data-types-graphics";
import { BitmapElementVisual, VisualFactory } from "scene-types";
import { VmBool } from "vm-interfaces-base";
import { BitmapObjectState, GraphicSpaceToolsState } from "vm-interfaces-graphics";
import { BitmapTool } from "../../tools";
import { Object2dMixin } from "./object2dMixin";
import { StratumError } from "~/helpers/errors";

export class BitmapObject extends Object2dMixin implements BitmapObjectState {
    readonly type: (BitmapElementData | DoubleBitmapElementData)["type"];
    private _bmpTool: BitmapTool;
    protected readonly _subclassInstance: this = this;
    visual: BitmapElementVisual;
    constructor(
        data: BitmapElementData | DoubleBitmapElementData,
        tools: GraphicSpaceToolsState,
        visualFactory: VisualFactory
    ) {
        super(data);
        this.type = data.type;
        const bmpTool = tools.getTool(
            data.type === "otBITMAP2D" ? "ttDIB2D" : "ttDOUBLEDIB2D",
            data.type === "otBITMAP2D" ? data.dibHandle : data.doubleDibHandle
        ) as BitmapTool;
        if (!bmpTool) {
            throw new StratumError(
                `${data.type === "otBITMAP2D" ? "Б" : "Двойная б"}итовая карта #${
                    data.type === "otBITMAP2D" ? data.dibHandle : data.doubleDibHandle
                } не существует`
            );
        }
        const { image, dimensions } = bmpTool;
        this.width = data.size.x = data.size.x || (dimensions && dimensions.width) || image.width;
        this.height = data.size.y = data.size.y || (dimensions && dimensions.height) || image.height;
        this.visual = visualFactory.createBitmap({
            handle: data.handle,
            position: data.position,
            size: data.size,
            isVisible: !!this.isVisible,
            selectable: !!this.selectable,
            bmpOrigin: data.bmpOrigin,
            bmpSize: data.bmpSize || data.size,
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
