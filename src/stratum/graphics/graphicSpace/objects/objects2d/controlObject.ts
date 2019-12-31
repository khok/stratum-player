import { ControlElementData } from "data-types-graphics";
import { ControlElementVisual, VisualFactory } from "scene-types";
import { ControlObjectState } from "vm-interfaces-graphics";
import { Object2dMixin } from "./object2dMixin";

export class ControlObject extends Object2dMixin implements ControlObjectState {
    readonly type = "otCONTROL2D";
    protected readonly _subclassInstance: this = this;
    visual: ControlElementVisual;
    private _text: string;
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
            controlSize: data.controlSize
        });
        this._text = data.text;
    }
    set text(value) {
        this._text = value;
    }
    get text(): string {
        return this._text;
    }
    unsubFromTools() {}
}
