import { NormalOmit } from "other-types";
import { BitmapElementVisual, VisualFactory } from "scene-types";
import { BitmapElementData, DoubleBitmapElementData } from "vdr-types";
import { VmBool } from "vm-interfaces-core";
import { BitmapObjectState } from "vm-interfaces-gspace";
import { StratumError } from "~/helpers/errors";
import { GraphicSpaceTools } from "../../graphicSpaceTools";
import { BitmapTool } from "../../tools";
import { Object2dMixin } from "./object2dMixin";

type elData = BitmapElementData | DoubleBitmapElementData;
type omitKeys = "name" | "options" | "size" | "bmpSize" | "bmpAngle" | "bmpOrigin";

export type BitmapObjectOptions = Partial<elData> & NormalOmit<elData, omitKeys>;

export class BitmapObject extends Object2dMixin implements BitmapObjectState {
    readonly type: (BitmapElementData | DoubleBitmapElementData)["type"];
    readonly visual: BitmapElementVisual;
    private _bmpTool: BitmapTool;
    constructor(data: BitmapObjectOptions, visualFactory: VisualFactory, tools: GraphicSpaceTools) {
        super(data);
        this.type = data.type;

        const bhandle = data.bmpHandle;
        const bmpTool = data.type === "otBITMAP2D" ? tools.bitmaps.get(bhandle) : tools.doubleBitmaps.get(bhandle);

        const textType = `Инструмент ${data.type === "otBITMAP2D" ? "Б" : "Двойная б"}итовая карта`;
        if (!bmpTool) throw new StratumError(`${textType} #${bhandle} не существует`);

        const bmpSize = data.bmpSize || data.size || bmpTool.dimensions;
        if (!bmpSize) throw new Error(`${textType}: у изображения нет размеров`);

        const scale = {
            x: data.size && data.bmpSize ? data.size.x / data.bmpSize.x : 1,
            y: data.size && data.bmpSize ? data.size.y / data.bmpSize.y : 1,
        };

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
