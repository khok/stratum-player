import { ControlElementData, Point2D } from "vdr-types";
import { ControlElementVisual, VisualFactory } from "scene-types";
import { ControlObjectState } from "vm-interfaces-gspace";
import { Object2dMixin, Object2dOptions } from "./object2dMixin";

export interface ControlObjectOptions extends Object2dOptions {
    classname: ControlElementData["classname"];
    text?: string;
    controlSize: Point2D;
}

export class ControlObject extends Object2dMixin implements ControlObjectState {
    readonly type = "otCONTROL2D";
    protected readonly _subclassInstance: this = this;
    visual: ControlElementVisual;
    constructor(data: ControlObjectOptions, visualFactory: VisualFactory) {
        super(data);
        this.visual = visualFactory.createControl({
            handle: data.handle,
            position: data.position,
            isVisible: !!this.isVisible,
            selectable: !!this.selectable,
            classname: data.classname,
            text: data.text,
            controlSize: data.controlSize,
        });
        if (!data.size) {
            const area = this.visual.getVisibleAreaSize();
            this.width = area.x;
            this.height = area.y;
        }
    }
    set text(value) {
        this.visual.setText(value);
    }
    get text(): string {
        return this.visual.getText();
    }
    protected unsubFromTools() {}
}
