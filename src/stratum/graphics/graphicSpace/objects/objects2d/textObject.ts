import { TextElementVisual, VisualFactory } from "scene-types";
import { VmBool } from "vm-interfaces-core";
import { GraphicSpaceToolsState, TextObjectState } from "vm-interfaces-gspace";
import { StratumError } from "~/helpers/errors";
import { TextTool } from "../../tools";
import { Object2dMixin, Object2dOptions } from "./object2dMixin";

export interface TextObjectOptions extends Object2dOptions {
    textToolHandle: number;
    angle?: number;
}

export class TextObject extends Object2dMixin implements TextObjectState {
    readonly type = "otTEXT2D";
    protected readonly _subclassInstance: this = this;
    private _text: TextTool;
    visual: TextElementVisual;
    constructor(data: TextObjectOptions, tools: GraphicSpaceToolsState, visualFactory: VisualFactory) {
        super(data);
        this._angle = data.angle || 0;
        const textTool = tools.getTool("ttTEXT2D", data.textToolHandle) as TextTool;
        if (!textTool) {
            throw new StratumError(`Инструмент Текст #${data.textToolHandle} не существует`);
        }
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

    protected unsubFromTools(): void {
        this.textTool.unsubscribe(this);
    }
}
