import { ControlElementData } from "data-types-graphics";
import { ControlElementVisual, VisualFactory } from "scene-types";
import { ControlObjectState } from "vm-interfaces-graphics";
import { Object2dMixin } from "./object2dMixin";

export class ControlObject extends Object2dMixin implements ControlObjectState {
    readonly type = "otCONTROL2D";
    protected readonly _subclassInstance: this = this;
    visual: ControlElementVisual;
    constructor(data: ControlElementData, visualFactory: VisualFactory) {
        super(data);
        this.visual = visualFactory.createControl({
            handle: data.handle,
            position: data.position,
            size: data.size,
            isVisible: !!this.isVisible,
            selectable: !!this.selectable,
            classname: data.classname,
            text: data.text,
            controlSize: data.controlSize,
        });
    }
    set text(value) {
        this.visual.setText(value);
    }
    get text(): string {
        return this.visual.getText();
    }
    unsubFromTools() {}
}
