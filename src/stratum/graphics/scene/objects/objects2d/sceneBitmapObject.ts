import { Optional } from "stratum/helpers/utilityTypes";
import { BadDataError } from "stratum/common/errors";
import { BitmapElement, DoubleBitmapElement } from "stratum/common/fileFormats/vdr/types/vectorDrawingElements";
import { BitmapObject } from "stratum/vm/interfaces/graphicSpaceObjects";
import { NumBool } from "stratum/vm/types";
import { RenderableFactory, RenderableBitmap } from "../../interfaces";
import { SceneTools } from "../../sceneTools";
import { SceneBmpTool } from "../../tools";
import { Object2dMixin } from "./object2dMixin";

type omitKeys = "name" | "options" | "size" | "bmpSize" | "bmpAngle" | "bmpOrigin";

export type SceneBitmapObjectArgs = Optional<BitmapElement | DoubleBitmapElement, omitKeys>;

export class SceneBitmapObject extends Object2dMixin implements BitmapObject {
    readonly type: (BitmapElement | DoubleBitmapElement)["type"];
    readonly renderable: RenderableBitmap;
    private _bmpTool: SceneBmpTool;

    static create(args: SceneBitmapObjectArgs, renderableFactory: RenderableFactory, tools: SceneTools) {
        const bhandle = args.bmpHandle;
        const bmpTool = args.type === "otBITMAP2D" ? tools.bitmaps.get(bhandle) : tools.doubleBitmaps.get(bhandle);
        if (!bmpTool) return undefined;

        // const textType = `${args.type === "otBITMAP2D" ? "Б" : "Двойная б"}итовая карта`;
        // if (!bmpTool) throw new NoSuchToolError(textType, args.handle, "Изображение", this.handle);
        return new SceneBitmapObject(args, renderableFactory, bmpTool);
    }

    constructor(args: SceneBitmapObjectArgs, renderableFactory: RenderableFactory, bmpTool: SceneBmpTool) {
        super(args);
        this.type = args.type;

        const bmpSize = args.bmpSize || args.size || bmpTool.size;
        if (!bmpSize) {
            const textType = `${args.type === "otBITMAP2D" ? "Б" : "Двойная б"}итовая карта`;
            throw new BadDataError(`${textType} #${args.handle}: у изображения нет размеров (объект: ${this.handle}).`);
        }

        const scale = {
            x: args.size && args.bmpSize ? args.size.x / args.bmpSize.x : 1,
            y: args.size && args.bmpSize ? args.size.y / args.bmpSize.y : 1,
        };

        this.renderable = renderableFactory.createBitmap({
            handle: args.handle,
            position: args.position,
            isVisible: !!this.isVisible,
            selectable: !!this.isSelectable,
            scale,
            bmpSize,
            bmpOrigin: args.bmpOrigin,
            bmpTool,
        });

        if (!args.size) {
            const area = this.renderable.getVisibleAreaSize();
            this.width = area.x;
            this.height = area.y;
        }

        this._bmpTool = bmpTool;
        bmpTool.subscribe(this, () => this.renderable.updateBitmap(bmpTool));
    }

    get bmpTool() {
        return this._bmpTool;
    }

    setRect(x: number, y: number, width: number, height: number): NumBool {
        this.renderable.setRect(x, y, width, height);
        return 1;
    }

    changeBmpTool(value: SceneBmpTool): NumBool {
        this.bmpTool.unsubscribe(this);
        value.subscribe(this, () => this.renderable.updateBitmap(value));
        this._bmpTool = value;
        return 1;
    }

    unsubFromTools() {
        this.bmpTool.unsubscribe(this);
    }
}
