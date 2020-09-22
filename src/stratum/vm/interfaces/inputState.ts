import { NumBool } from "../types";

export interface InputState {
    isKeyPressed(keyIndex: number): NumBool;
}
