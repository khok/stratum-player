import { PartialOptionalData } from "other-types";
import { ControlElementVisual, VisualFactory } from "scene-types";
import { ControlElementData } from "vdr-types";
import { VmBool } from "vm-interfaces-core";
import { ControlObjectState } from "vm-interfaces-gspace";
import { Object2dMixin } from "./object2dMixin";

type omitKeys = "name" | "options" | "size" | "exStyle" | "dwStyle" | "id" | "text";
export type ControlObjectOptions = PartialOptionalData<ControlElementData, omitKeys>;

export class ControlObject extends Object2dMixin implements ControlObjectState {
    readonly type = "otCONTROL2D";
    readonly visual: ControlElementVisual;
    constructor(data: ControlObjectOptions, visualFactory: VisualFactory) {
        super(data);
        this.visual = visualFactory.createControl({
            handle: data.handle,
            position: data.position,
            isVisible: !!this.isVisible,
            selectable: !!this.isSelectable,
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

    get text(): string {
        return this.visual.getText();
    }

    setText(value: string): VmBool {
        this.visual.setText(value);
        return 1;
    }
}
