import { Env, NumBool } from "stratum/env";
import { ToolSubscriber } from "./toolSubscriber";

export interface StringToolArgs {
    handle: number;
    text: string;
}

export class StringTool implements Env.StringTool {
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
    text(): string {
        return this._text;
    }
    setText(value: string): NumBool {
        this._text = value;
        this.subs.forEach((s) => s.toolChanged());
        return 1;
    }
}
