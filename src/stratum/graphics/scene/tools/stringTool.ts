import { NumBool } from "stratum/common/types";
import { HandleMap } from "stratum/helpers/handleMap";
import { Scene } from "../scene";
import { ToolSubscriber } from "./toolSubscriber";

export interface StringToolArgs {
    handle: number;
    text: string;
}

export class StringTool {
    private subs: Set<ToolSubscriber>;
    private _text: string;

    handle: number;
    constructor({ handle, text }: StringToolArgs) {
        this.handle = handle;
        this.subs = new Set();
        this._text = text;
    }
    subscribe(sub: ToolSubscriber) {
        this.subs.add(sub);
    }
    unsubscribe(sub: ToolSubscriber) {
        this.subs.delete(sub);
    }
    subCount(): number {
        return this.subs.size;
    }
    copy(scene: Scene): StringTool {
        const handle = HandleMap.getFreeHandle(scene.strings);
        const tool = new StringTool({
            handle,
            text: this._text,
        });
        scene.strings.set(handle, tool);
        return tool;
    }
    text(): string {
        return this._text;
    }
    setText(value: string): NumBool {
        this._text = value;
        this.subs.forEach((s) => s.toolChanged(this));
        return 1;
    }
}
