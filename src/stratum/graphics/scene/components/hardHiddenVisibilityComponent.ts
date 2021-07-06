import { VisibilityComponent } from "./visibilityComponent";

export class HardHiddenVisibilityComponent extends VisibilityComponent {
    override visible(): boolean {
        return false;
    }
}
