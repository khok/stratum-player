import { BitmapElementVisual, VisualFactory } from "scene-types";
import { BitmapElementData, DoubleBitmapElementData, Point2D } from "vdr-types";
import { VmBool } from "vm-interfaces-core";
import { BitmapObjectState, GraphicSpaceToolsState } from "vm-interfaces-gspace";
import { StratumError } from "~/helpers/errors";
import { BitmapTool } from "../../tools";
import { Object2dMixin, Object2dOptions } from "./object2dMixin";

export interface BitmapObjectOptions extends Object2dOptions {
    type: BitmapElementData["type"];
    bmpOrigin?: Point2D;
    bmpSize?: Point2D;
    dibHandle: number;
}

export interface DoubleBitmapObjectOptions extends Object2dOptions {
    type: DoubleBitmapElementData["type"];
    bmpOrigin?: Point2D;
    bmpSize?: Point2D;
    doubleDibHandle: number;
}

export class BitmapObject extends Object2dMixin implements BitmapObjectState {
    readonly type: (BitmapElementData | DoubleBitmapElementData)["type"];
    readonly visual: BitmapElementVisual;
    private _bmpTool: BitmapTool;
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

        const bmpSize = data.bmpSize || data.size || bmpTool.dimensions;
        if (!bmpSize) {
            throw new Error(`Битовая карта ${bmpTool.handle}: у изображения нет размеров`);
        }

        this.visual = visualFactory.createBitmap({
            handle: data.handle,
            position: data.position,
            isVisible: !!this.isVisible,
            selectable: !!this.isSelectable,
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
        this._bmpTool = bmpTool;
        bmpTool.subscribe(this, () => this.visual.updateBitmap(bmpTool));
    }

    get bmpTool() {
        return this._bmpTool;
    }

    setRect(x: number, y: number, width: number, height: number): VmBool {
        this.visual.setRect(x, y, width, height);
        return 1;
    }

    changeBmpTool(value: BitmapTool): VmBool {
        this.bmpTool.unsubscribe(this);
        value.subscribe(this, () => this.visual.updateBitmap(value));
        this._bmpTool = value;
        return 1;
    }

    unsubFromTools() {
        this.bmpTool.unsubscribe(this);
    }
}
