import { StringToolParams } from "stratum/fileFormats/vdr";
import { Remove } from "stratum/helpers/utilityTypes";
import { NumBool } from "stratum/translator";
import { SceneToolMixin } from "./sceneToolMixin";

export type SceneStringToolArgs = Remove<StringToolParams, "type">;

export class SceneStringTool extends SceneToolMixin {
    private _text: string;

    constructor(args: SceneStringToolArgs) {
        super(args);
        this._text = args.text;
    }

    get text(): string {
        return this._text;
    }

    setText(value: string): NumBool {
        this._text = value;
        this.dispatchChanges();
        return 1;
    }
}
