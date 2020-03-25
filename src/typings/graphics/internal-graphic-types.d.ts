declare module "internal-graphic-types" {
    /**
     * Загрузчик изображений.
     */
    export interface ImageResolver {
        fromProjectFile(bmpFilename: string): HTMLImageElement;
        fromBase64(data: string, type: "bmp" | "png"): HTMLImageElement;
        fromIconUrl(filename: string): HTMLImageElement;
    }

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
