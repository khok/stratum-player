import { Object2dMixin } from "./object2dMixin";
import { TextObjectState, GraphicSpaceToolsState } from "vm-interfaces-graphics";
import { TextElementData } from "data-types-graphics";
import { VisualFactory, TextElementVisual } from "scene-types";
import { TextTool } from "../../tools";
import { StratumError } from "~/helpers/errors";

export class TextObject extends Object2dMixin implements TextObjectState {
    readonly type = "otTEXT2D";
    protected readonly _subclassInstance: this = this;
    private _text: TextTool | undefined;
    visual: TextElementVisual;
    constructor(data: TextElementData, tools: GraphicSpaceToolsState, visualFactory: VisualFactory) {
        super(data);
        const textTool = tools.getTool<TextTool>("ttTEXT2D", data.textHandle);
        if (!textTool) {
            //TODO: fix
            throw new StratumError(`Инструмент Текст #${data.textHandle} не существует`);
        }
        this.visual = visualFactory.createText({
            handle: data.handle,
            position: data.position,
            size: data.size,
            isVisible: !!this.isVisible,
            selectable: !!this.selectable,
            text: textTool
        });
        this.text = textTool;
    }
    get text(): TextTool {
        return this._text!;
    }
    set text(value) {
        if (this._text) this._text.unsubscribe(this);
        this._text = value;
        value.subscribe(this, t => this.visual.updateText(t));
    }
    unsubFromTools(): void {
        this.text.unsubscribe(this);
    }
}
