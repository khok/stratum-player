declare module "internal-graphic-types" {
    export interface HtmlTextInputWrapperOptions {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        text?: string;
        hidden?: boolean;
    }

    export interface HtmlTextInputWrapper extends Readonly<Required<HtmlTextInputWrapperOptions>> {
        set(options: HtmlTextInputWrapperOptions): HtmlTextInputWrapper;
        destroy(): void;
        onChange(fn: () => void): void;
    }

    export interface HTMLInputElementsFactory {
        createTextInput(options: HtmlTextInputWrapperOptions): HtmlTextInputWrapper;
    }
}
