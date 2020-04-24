import { PartialOptionalData } from "other-types";
import { TextElementVisual, VisualFactory } from "scene-types";
import { TextElementData } from "vdr-types";
import { VmBool } from "vm-interfaces-core";
import { TextObjectState } from "vm-interfaces-gspace";
import { StratumError } from "~/helpers/errors";
import { GraphicSpaceTools } from "../../graphicSpaceTools";
import { TextTool } from "../../tools";
import { Object2dMixin } from "./object2dMixin";

type omitKeys = "name" | "options" | "size" | "angle" | "delta";

export type TextObjectOptions = PartialOptionalData<TextElementData, omitKeys>;

export class TextObject extends Object2dMixin implements TextObjectState {
    readonly type = "otTEXT2D";
    readonly visual: TextElementVisual;
    private _text: TextTool;
    constructor(data: TextObjectOptions, visualFactory: VisualFactory, tools: GraphicSpaceTools) {
        super(data);
        this._angle = data.angle || 0;
        const textTool = tools.texts.get(data.textToolHandle);
        if (!textTool) throw new StratumError(`Инструмент Текст #${data.textToolHandle} не существует`);
        this.visual = visualFactory.createText({
            handle: data.handle,
            position: data.position,
            isVisible: !!this.isVisible,
            selectable: !!this.isSelectable,
            angle: data.angle,
            textTool,
        });
        if (!data.size) {
            const area = this.visual.getVisibleAreaSize();
            this.width = area.x;
            this.height = area.y;
        }
        this._text = textTool;
        textTool.subscribe(this, () => this.visual.updateTextTool(textTool));
    }

    get textTool(): TextTool {
        return this._text;
    }

    changeTextTool(value: TextTool): VmBool {
        this._text.unsubscribe(this);
        this._text = value;
        value.subscribe(this, () => this.visual.updateTextTool(value));
        return 1;
    }

    unsubFromTools(): void {
        this.textTool.unsubscribe(this);
    }
}
