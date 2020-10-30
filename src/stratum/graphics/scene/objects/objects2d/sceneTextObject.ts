import { TextElement } from "stratum/fileFormats/vdr";
import { Optional } from "stratum/helpers/utilityTypes";
import { TextObject } from "stratum/vm/interfaces/graphicSpaceObjects";
import { NumBool } from "stratum/vm/types";
import { RenderableFactory, RenderableText } from "../../interfaces";
import { SceneTools } from "../../sceneTools";
import { SceneTextTool } from "../../tools";
import { Object2dMixin } from "./object2dMixin";

type omitKeys = "type" | "name" | "options" | "size" | "angle" | "delta";

export type SceneTextObjectArgs = Optional<TextElement, omitKeys>;

export class SceneTextObject extends Object2dMixin implements TextObject {
    readonly type = "otTEXT2D";
    readonly renderable: RenderableText;

    private _text: SceneTextTool;

    static create(args: SceneTextObjectArgs, renderableFactory: RenderableFactory, tools: SceneTools) {
        const textTool = tools.texts.get(args.textToolHandle);
        // if (!textTool) throw new NoSuchToolError("Текст", args.textToolHandle, "Текст", this.handle);
        if (!textTool) return undefined;
        return new SceneTextObject(args, renderableFactory, textTool);
    }

    constructor(args: SceneTextObjectArgs, renderableFactory: RenderableFactory, textTool: SceneTextTool) {
        super(args);
        this._angle = args.angle || 0;

        this.renderable = renderableFactory.createText({
            handle: args.handle,
            position: args.position,
            isVisible: !!this.isVisible,
            selectable: !!this.isSelectable,
            angle: args.angle,
            textTool,
        });

        if (!args.size) {
            const area = this.renderable.getVisibleAreaSize();
            this.width = area.x;
            this.height = area.y;
        }

        this._text = textTool;
        textTool.subscribe(this, () => this.renderable.updateTextTool(textTool));
    }

    get textTool(): SceneTextTool {
        return this._text;
    }

    changeTextTool(value: SceneTextTool): NumBool {
        this._text.unsubscribe(this);
        this._text = value;
        value.subscribe(this, () => this.renderable.updateTextTool(value));
        return 1;
    }

    unsubFromTools(): void {
        this.textTool.unsubscribe(this);
    }
}
