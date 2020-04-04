import { Object2dMixin } from "./object2dMixin";
import { TextObjectState, GraphicSpaceToolsState } from "vm-interfaces-graphics";
import { TextElementData } from "data-types-graphics";
import { VisualFactory, TextElementVisual } from "scene-types";
import { TextTool } from "../../tools";
import { StratumError } from "~/helpers/errors";

export class TextObject extends Object2dMixin implements TextObjectState {
    readonly type = "otTEXT2D";
    protected readonly _subclassInstance: this = this;
    private _text: TextTool;
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
            angle: data.angle,
            size: data.size,
            isVisible: !!this.isVisible,
            selectable: !!this.selectable,
            textTool,
        });
        this._text = textTool;
        textTool.subscribe(this, () => this.visual.updateText(textTool));
    }
    get textTool(): TextTool {
        return this._text;
    }
    set textTool(value) {
        this._text.unsubscribe(this);
        this._text = value;
        value.subscribe(this, () => this.visual.updateText(value));
    }
    protected unsubFromTools(): void {
        this.textTool.unsubscribe(this);
    }
}
