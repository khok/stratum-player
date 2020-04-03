import { ToolMixin } from "./toolMixin";
import { TextToolState, TextFragment } from "vm-interfaces-graphics";
import { FontTool } from "./fontTool";
import { StringTool } from "./stringTool";
import { StringColor } from "data-types-graphics";

export interface TextToolTextFragment {
    font: FontTool;
    stringFragment: StringTool;
    foregroundColor: StringColor;
    backgroundColor: StringColor;
}

export class TextTool extends ToolMixin<TextTool> implements TextToolState {
    readonly type = "ttTEXT2D";
    private cachedString?: { text: string; size: number };
    constructor(private fragments: TextToolTextFragment[]) {
        super();
        this.fragments.forEach(({ font, stringFragment }, idx) => {
            font.subscribe(this, (f) => this.updateFont(f, idx));
            stringFragment.subscribe(this, (s) => this.updateString(s, idx));
        });
    }
    updateString(str: StringTool, idx: number) {
        this.fragments[idx].stringFragment = str;
        this.cachedString = undefined;
        this.dispatchChanges();
    }
    updateFont(font: FontTool, idx: number) {
        this.fragments[idx].font = font;
        this.cachedString = undefined;
        this.dispatchChanges();
    }
    updateFgColor(color: StringColor, idx: number) {
        this.fragments[idx].foregroundColor = color;
        this.cachedString = undefined;
        this.dispatchChanges();
    }
    updateBgColor(color: StringColor, idx: number) {
        this.fragments[idx].backgroundColor = color;
        this.cachedString = undefined;
        this.dispatchChanges();
    }
    get textCount(): number {
        return this.fragments.length;
    }
    getFragment(index: number): TextFragment {
        return this.fragments[index];
    }
    get assembledText(): { text: string; size: number } {
        if (!this.cachedString) {
            const text = this.fragments.reduce((acc, f) => acc + f.stringFragment.text, "");
            const size = this.fragments.reduce((acc, f) => acc + f.font.size, 0) / this.fragments.length;
            this.cachedString = { text, size };
        }
        return this.cachedString;
    }
    unsubFromTools() {
        this.fragments.forEach(({ font, stringFragment }) => {
            font.unsubscribe(this);
            stringFragment.unsubscribe(this);
        });
    }
}
