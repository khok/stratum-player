import { ControlElementData } from "data-types-graphics";
import { ControlElementVisual, VisualFactory } from "scene-types";
import { ControlObjectState, GraphicSpaceToolsState } from "vm-interfaces-graphics";
import { Object2dMixin } from "./object2dMixin";

export class ControlObject extends Object2dMixin implements ControlObjectState {
    unsubFromTools() {}
    protected readonly _subclassInstance: this = this;
    readonly type = "otCONTROL2D";
    visual: ControlElementVisual;
    text: string;
    constructor(data: ControlElementData, tools: GraphicSpaceToolsState, visualFactory: VisualFactory) {
        super(data);
        this.visual = visualFactory.createControl({ ...data, isVisible: !!this.isVisible });
        this.text = data.text;
    }
}
