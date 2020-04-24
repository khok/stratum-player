import { NormalOmit } from "other-types";
import { TextToolData } from "vdr-types";
import { TextFragment, TextToolState } from "vm-interfaces-gspace";
import { StratumError } from "~/helpers/errors";
import { HandleMap } from "~/helpers/handleMap";
import { FontTool } from "./fontTool";
import { StringTool } from "./stringTool";
import { ToolMixin } from "./toolMixin";

export interface TextToolTextFragment {
    font: FontTool;
    stringFragment: StringTool;
    foregroundColor: number;
    backgroundColor: number;
}

export type TextToolOptions = NormalOmit<TextToolData, "type">;

export class TextTool extends ToolMixin<TextTool> implements TextToolState {
    private cachedString?: { text: string; size: number };
    private fragments: TextToolTextFragment[];

    constructor(data: TextToolOptions, fonts: HandleMap<FontTool>, strings: HandleMap<StringTool>) {
        super(data);
        this.fragments = data.textCollection.map(({ fontHandle, stringHandle, foregroundColor, backgroundColor }) => {
            const font = fonts.get(fontHandle);
            if (!font) throw new StratumError(`Инструмент Шрифт #${fontHandle} не существует`);
            font.subscribe(this, () => this.update());

            const stringFragment = strings.get(stringHandle);
            if (!stringFragment) throw new StratumError(`Инструмент Строка #${stringHandle} не существует`);
            stringFragment.subscribe(this, () => this.update());

            return { font, stringFragment, foregroundColor, backgroundColor };
        });
    }

    get textCount(): number {
        return this.fragments.length;
    }

    get assembledText(): { text: string; size: number } {
        if (!this.cachedString) {
            const text = this.fragments.reduce((acc, f) => acc + f.stringFragment.text, "");
            const size = this.fragments.reduce((acc, f) => acc + f.font.size, 0) / this.fragments.length;
            this.cachedString = { text, size };
        }
        return this.cachedString;
    }

    getFragment(index: number): TextFragment {
        return this.fragments[index];
    }

    updateString(str: StringTool, idx: number) {
        const oldFrag = this.fragments[idx].stringFragment;
        if (oldFrag !== str) {
            this.fragments[idx].stringFragment = str;
            if (oldFrag) oldFrag.unsubscribe(this);
            str.subscribe(this, () => this.dispatchChanges());
        }
        this.update();
    }

    updateFont(font: FontTool, idx: number) {
        const oldFont = this.fragments[idx].font;
        if (oldFont !== font) {
            this.fragments[idx].font = font;
            if (oldFont) oldFont.unsubscribe(this);
            font.subscribe(this, () => this.dispatchChanges());
        }
        this.update();
    }

    updateFgColor(color: number, idx: number) {
        this.fragments[idx].foregroundColor = color;
        this.update();
    }

    updateBgColor(color: number, idx: number) {
        this.fragments[idx].backgroundColor = color;
        this.update();
    }

    private update() {
        this.cachedString = undefined;
        this.dispatchChanges();
    }

    unsubFromTools() {
        this.fragments.forEach(({ font, stringFragment }) => {
            font.unsubscribe(this);
            stringFragment.unsubscribe(this);
        });
    }
}
