import { BitmapElementData, DoubleBitmapElementData, Point2D } from "data-types-graphics";
import { BitmapElementVisual, VisualFactory } from "scene-types";
import { VmBool } from "vm-interfaces-base";
import { BitmapObjectState, GraphicSpaceToolsState } from "vm-interfaces-graphics";
import { StratumError } from "~/helpers/errors";
import { BitmapTool } from "../../tools";
import { Object2dMixin, Object2dOptions } from "./object2dMixin";

interface _BmpObjectOptionsBase extends Object2dOptions {
    bmpOrigin?: Point2D;
    bmpSize?: Point2D;
}

export interface BitmapObjectOptions extends _BmpObjectOptionsBase {
    type: BitmapElementData["type"];
    dibHandle: number;
}

export interface DoubleBitmapObjectOptions extends _BmpObjectOptionsBase {
    type: DoubleBitmapElementData["type"];
    doubleDibHandle: number;
}

export class BitmapObject extends Object2dMixin implements BitmapObjectState {
    readonly type: (BitmapElementData | DoubleBitmapElementData)["type"];
    private _bmpTool: BitmapTool;
    protected readonly _subclassInstance: this = this;
    visual: BitmapElementVisual;
    constructor(
        data: BitmapObjectOptions | DoubleBitmapObjectOptions,
        tools: GraphicSpaceToolsState,
        visualFactory: VisualFactory
    ) {
        super(data);
        this.type = data.type;
        const toolType = data.type === "otBITMAP2D" ? "ttDIB2D" : "ttDOUBLEDIB2D";
        const toolHandle = data.type === "otBITMAP2D" ? data.dibHandle : data.doubleDibHandle;
        const bmpTool = tools.getTool(toolType, toolHandle) as BitmapTool;
        if (!bmpTool) {
            //prettier-ignore
            throw new StratumError(`${data.type === "otBITMAP2D" ? "Б" : "Двойная б"}итовая карта #${toolHandle} не существует`);
        }
        const scale = {
            x: data.size && data.bmpSize ? data.size.x / data.bmpSize.x : 1,
            y: data.size && data.bmpSize ? data.size.y / data.bmpSize.y : 1,
        };
        // if (!data.size) {
        //     const { image, dimensions } = bmpTool;
        //     this.width = dimensions ? dimensions.width : image.width;
        //     this.height = dimensions ? dimensions.height : image.height;
        // } else if (data.bmpSize) {
        //     scale = {
        //         x: data.size.x / data.bmpSize.x,
        //         y: data.size.y / data.bmpSize.y,
        //     };
        // }

        // const bmpOrigin = data.bmpOrigin || { x: 0, y: 0 };
        const bmpSize = data.bmpSize || data.size || bmpTool.dimensions;
        if (!bmpSize) {
            throw new Error(`Битовая карта ${bmpTool.handle}: у изображения нет размеров`);
        }

        this.visual = visualFactory.createBitmap({
            handle: data.handle,
            position: data.position,
            isVisible: !!this.isVisible,
            selectable: !!this.selectable,
            scale,
            bmpSize,
            bmpOrigin: data.bmpOrigin,
            bmpTool,
        });
        if (!data.size) {
            const area = this.visual.getVisibleAreaSize();
            this.width = area.x;
            this.height = area.y;
        }
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
