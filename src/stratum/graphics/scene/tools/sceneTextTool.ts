import { HandleMap } from "stratum/helpers/handleMap";
import { Remove } from "stratum/helpers/utilityTypes";
import { TextToolParams } from "stratum/common/fileFormats/vdr/types/vectorDrawingTools";
import { TextFragment, TextTool } from "stratum/vm/interfaces/graphicSpaceTools";
import { SceneFontTool, SceneStringTool } from ".";
import { SceneToolMixin } from "./sceneToolMixin";

export interface SceneTextFragment extends TextFragment {
    font: SceneFontTool;
    stringFragment: SceneStringTool;
    foregroundColor: number;
    backgroundColor: number;
}

export type SceneTextToolArgs = Remove<TextToolParams, "type">;

export class SceneTextTool extends SceneToolMixin implements TextTool {
    private cachedString?: { text: string; size: number };
    private fragments: SceneTextFragment[];

    static create(args: SceneTextToolArgs, fonts: HandleMap<SceneFontTool>, strings: HandleMap<SceneStringTool>) {
        const count = args.textCollection.length;
        const fragments = new Array<SceneTextFragment>();
        for (let i = 0; i < count; i++) {
            const { fontHandle, stringHandle, foregroundColor, backgroundColor } = args.textCollection[i];
            const font = fonts.get(fontHandle);
            // if (!font) throw new NoSuchToolError("Шрифт", fontHandle, "Инструмент 'Текст'", this.handle);
            if (!font) return undefined;
            const stringFragment = strings.get(stringHandle);
            // if (!stringFragment) throw new NoSuchToolError("Строка", stringHandle, "Инструмент 'Текст'", this.handle);
            if (!stringFragment) return undefined;
            fragments[i] = { font, stringFragment, foregroundColor, backgroundColor };
        }
        return new SceneTextTool({ handle: args.handle, fragments });
    }

    constructor(args: { handle: number; fragments: SceneTextFragment[] }) {
        super(args);
        args.fragments.forEach((f) => {
            f.font.subscribe(this, () => this.update());
            f.stringFragment.subscribe(this, () => this.update());
        });
        this.fragments = args.fragments;
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

    getFragment(index: number): SceneTextFragment {
        return this.fragments[index];
    }

    updateString(str: SceneStringTool, idx: number) {
        const oldFrag = this.fragments[idx].stringFragment;
        if (oldFrag !== str) {
            this.fragments[idx].stringFragment = str;
            if (oldFrag) oldFrag.unsubscribe(this);
            str.subscribe(this, () => this.dispatchChanges());
        }
        this.update();
    }

    updateFont(font: SceneFontTool, idx: number) {
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
