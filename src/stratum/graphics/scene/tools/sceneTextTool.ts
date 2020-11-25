import { TextToolParams } from "stratum/fileFormats/vdr";
import { HandleMap } from "stratum/helpers/handleMap";
import { Remove } from "stratum/helpers/utilityTypes";
import { NumBool } from "stratum/translator";
import { SceneFontTool, SceneStringTool } from ".";
import { SceneToolMixin } from "./sceneToolMixin";

export interface SceneTextFragment {
    font: SceneFontTool;
    stringFragment: SceneStringTool;
    foregroundColor: number;
    backgroundColor: number;
}

export type SceneTextToolArgs = Remove<TextToolParams, "type">;

export class SceneTextTool extends SceneToolMixin {
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

    getStringHandle(index: number): number {
        const frag = this.fragments[0];
        return frag !== undefined ? frag.stringFragment.handle : 0;
    }

    getFontHandle(index: number): number {
        const frag = this.fragments[0];
        return frag !== undefined ? frag.font.handle : 0;
    }

    getFgColor(index: number): number {
        const frag = this.fragments[0];
        return frag !== undefined ? frag.foregroundColor : 0;
    }

    getBgColor(index: number): number {
        const frag = this.fragments[0];
        return frag !== undefined ? frag.backgroundColor : 0;
    }

    setValues(index: number, hfont: number, hstring: number, fgColor: number, bgColor: number): NumBool {
        throw Error();
    }
    updateVals2(index: number, hfont: SceneFontTool | undefined, hstring: SceneStringTool | undefined, fgColor: number, bgColor: number): NumBool {
        const frag = this.fragments[0];
        if (frag === undefined) return 0;

        const oldFont = frag.font;
        if (hfont !== undefined && oldFont !== hfont) {
            frag.font = hfont;
            if (oldFont) oldFont.unsubscribe(this);
            hfont.subscribe(this, () => this.dispatchChanges());
        }

        const oldStr = frag.stringFragment;
        if (hstring !== undefined && oldStr !== hstring) {
            frag.stringFragment = hstring;
            if (oldStr) oldStr.unsubscribe(this);
            hstring.subscribe(this, () => this.dispatchChanges());
        }

        frag.foregroundColor = fgColor;
        frag.backgroundColor = bgColor;
        this.update();
        return 1;
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
